import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'scripts/', 'output/', 'node_modules/'],
  },
  ...tseslint.configs.recommended,
);
