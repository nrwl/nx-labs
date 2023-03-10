import { ExecutorContext } from '@nrwl/devkit';
import { rmSync } from 'fs';
import * as path from 'path';
import { createCompiler } from '../../utils/create-compiler';
import { RspackExecutorSchema } from './schema';

export default async function runExecutor(
  options: RspackExecutorSchema,
  context: ExecutorContext
) {
  process.env.NODE_ENV ??= 'production';

  // Mimic --clean from webpack.
  rmSync(path.join(context.root, options.outputPath), {
    force: true,
    recursive: true,
  });

  const compiler = await createCompiler(options, context);

  return new Promise<{ success: boolean }>((res) => {
    compiler.run((error, stats) => {
      // OURS
      compiler.close(() => {
        if (error) {
          console.error(error);
          res({ success: false });
          return;
        }
        if (!compiler || !stats) {
          res({ success: false });
          return;
        }

        // TODO: Handle MultipleCompiler
        const statsOptions = compiler.options
            ? compiler.options.stats
            : undefined;
        const printedStats = stats.toString(statsOptions);
        // Avoid extra empty line when `stats: 'none'`
        if (printedStats) {
          console.error(printedStats);
        }
        res({ success: !stats.hasErrors() });
      });
    });
  });
}
