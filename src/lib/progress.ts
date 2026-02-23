import ora, { type Ora } from 'ora';
import chalk from 'chalk';

let spinner: Ora | null = null;

export function startStep(label: string): void {
  spinner = ora(label).start();
}

export function updateStep(label: string): void {
  if (spinner) spinner.text = label;
}

export function succeedStep(label?: string): void {
  if (spinner) {
    spinner.succeed(label);
    spinner = null;
  }
}

export function failStep(label?: string): void {
  if (spinner) {
    spinner.fail(label);
    spinner = null;
  }
}

export function info(message: string): void {
  console.log(chalk.cyan('  ℹ'), message);
}

export function summary(lines: string[]): void {
  console.log();
  console.log(chalk.bold.green('  Done!'));
  for (const line of lines) {
    console.log(chalk.gray(`  → ${line}`));
  }
  console.log();
}
