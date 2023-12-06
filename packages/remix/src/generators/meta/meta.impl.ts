import { Tree } from '@nx/devkit';
import { MetaSchema } from './schema';

import { normalizeOptions } from './lib/normalize-options';
import { v1MetaGenerator } from './lib/v1.impl';
import { v2MetaGenerator } from './lib/v2.impl';

export default async function (tree: Tree, schema: MetaSchema) {
  const options = await normalizeOptions(tree, schema);

  if (options.version === '1') {
    await v1MetaGenerator(tree, options);
  } else if (options.version === '2') {
    await v2MetaGenerator(tree, options);
  } else {
    throw new Error('Invalid version provided.');
  }
}
