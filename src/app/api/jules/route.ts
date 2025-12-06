import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

const ENGINE_PATH = path.join(process.cwd(), 'engine');

/**
 * Execute a Python command and return the result.
 */
function runPythonCommand(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('python', args, {
      cwd: ENGINE_PATH,
      env: {
        ...process.env,
        PYTHONPATH: ENGINE_PATH,
      },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

/**
 * GET /api/jules - Get orchestrator status
 */
export async function GET() {
  try {
    const result = await runPythonCommand([
      'orchestrator.py',
      'status',
      '--state', path.join(process.cwd(), 'data', 'gamestate.json'),
    ]);

    if (result.code !== 0) {
      return NextResponse.json(
        { error: 'Failed to get status', details: result.stderr },
        { status: 500 }
      );
    }

    const status = JSON.parse(result.stdout);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jules - Start or control Jules turns
 *
 * Body:
 * - action: 'start' | 'check' | 'complete' | 'run'
 * - prompts?: { [tribe: string]: string[] } - Optional community prompts
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, prompts, owner, repo } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    const validActions = ['start', 'check', 'complete', 'run'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const args = [
      'orchestrator.py',
      action,
      '--state', path.join(process.cwd(), 'data', 'gamestate.json'),
    ];

    if (owner) {
      args.push('--owner', owner);
    }
    if (repo) {
      args.push('--repo', repo);
    }

    const result = await runPythonCommand(args);

    if (result.code !== 0) {
      return NextResponse.json(
        { error: `Action '${action}' failed`, details: result.stderr },
        { status: 500 }
      );
    }

    try {
      const response = JSON.parse(result.stdout);
      return NextResponse.json(response);
    } catch {
      return NextResponse.json({
        success: true,
        output: result.stdout,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
