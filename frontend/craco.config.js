const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
          // Resolve WASM and CommonJS
          webpackConfig.resolve.extensions.push(".wasm");
          webpackConfig.experiments = {
            asyncWebAssembly: true,
          };
          webpackConfig.module.rules.forEach((rule) => {
            (rule.oneOf ?? []).forEach((oneOf) => {
              if (oneOf.type === "asset/resource") {
                // Including .cjs here solves `nanoid is not a function`
                oneOf.exclude.push(/\.wasm$/, /\.cjs$/);
              } else if (new RegExp(oneOf.test).test(".d.ts")) {
                // Exclude declaration files from being loaded by babel
                oneOf.exclude = [/\.d\.ts$/];
              }
            });
          });
    
          webpackConfig.module.rules.push(
            // Fix process error on @lezer/lr
            {
              test: /@lezer\/lr\/dist\/\w+\.js$/,
              resolve: { fullySpecified: false },
            },
    
            // Raw imports
            {
              test: /\.(d\.ts|raw|rs|py|md|toml)$/,
              type: "asset/source",
            },
    
            // Resource query
            {
              resourceQuery: /resource/,
              type: "asset/resource",
            }
          );
    
          // Resolve node polyfills
          webpackConfig.resolve.fallback = {

            // Fix `Module not found: Error: Can't resolve 'perf_hooks'` from typescript
            perf_hooks: false,
    
          };
    
          // Plugins
          webpackConfig.plugins.push(
            // Buffer
            new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    
            // Process
            new webpack.ProvidePlugin({
              process: "process/browser",
            }),
    

    
            // Ignore `Critical dependency: the request of a dependency is an expression`
            // from typescript and mocha
            new webpack.ContextReplacementPlugin(/^\.$/, (context) => {
              if (/\/node_modules\/(typescript|mocha)\/lib/.test(context.context)) {
                for (const d of context.dependencies) {
                  if (d.critical) d.critical = false;
                }
              }
            }),
    
            // Define globals
            new webpack.DefinePlugin({
              
              /** Supported packages(TypeScript) */
              PACKAGES: fs.readFileSync(
                path.join("..", "supported-packages.json"),
                "utf8"
              ),
    
            })
          );
    
          // Ignore useless warnings
          webpackConfig.ignoreWarnings = [
            /Failed to parse source map/,
    
            // https://github.com/GoogleChromeLabs/wasm-bindgen-rayon/issues/23
            /Circular dependency between chunks with runtime/,
          ];
    
          return webpackConfig;
        },
      }
}