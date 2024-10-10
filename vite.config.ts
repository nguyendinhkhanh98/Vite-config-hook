import { build, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from "vite-plugin-static-copy";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import fs, { Dir } from 'fs';
import path from 'path';

const clientRoot = './src/client';
const outDir = './dist';
const copyAppscriptEntry = './appsscript.json';

const dirs = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'dist', 'client'),
    path.join(__dirname, 'dist', 'server'),
];

const clientEntryPoints = [
    {
        filename: "sidebar",
        template: "client/sidebar.html"
    },
    {
        filename: "modalPickTemplate",
        template: "client/modalPickTemplate.html"
    },
    {
        filename: "modalPickTemplateSelectSellerMarket",
        template: "client/modalPickTemplateSelectSellerMarket.html"
    },
    {
        filename: "modalGetMyData",
        template: "client/modalGetMyData.html"
    }
]

const createFolderNotExists = () => {
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        } else {
            console.log(`Directory already exists: ${dir}`);
        }
    });
}


const buildClient = (mode) => {
    return {
        name: 'custom-build-client',
        apply: 'build',
        closeBundle: async () => {
            createFolderNotExists()

            let cloneClientEntryPoints = [...clientEntryPoints]

            for(let index in cloneClientEntryPoints)
            {
                const clientBuildConfig = defineConfig({
                    plugins: [
                        react(),
                        viteSingleFile()
                    ],
                    root: resolve(__dirname, clientRoot),
                    build: {
                        sourcemap: false,
                        write: false,
                        emptyOutDir: false,
                        minify: mode && mode == "production" ? true : false,
                        rollupOptions: {
                            external: [
                                'react',
                                'react-dom',
                                'react-bootstrap'
                            ],
                            output: {
                                format: 'iife',
                                dir: outDir,
                                globals: {
                                    'react': 'React',
                                    'react-dom': 'ReactDOM',
                                    'react-bootstrap': 'ReactBootstrap'
                                }
                            },
                            input: resolve(__dirname, clientRoot, `${cloneClientEntryPoints[index].filename}.html`),
                        }
                    }
                })

                const clientOutput = await build(clientBuildConfig);

                await writeFile(
                    resolve(__dirname, outDir + '/client', `${cloneClientEntryPoints[index].filename}.html`),
                    clientOutput.output[0].source
                );
            }
        }
    }

}

export default ({ command, mode }) => {
    if (command === 'serve') {
        return defineConfig({
            build: {
                sourcemap: false,
                write: true,
                emptyOutDir: true,
                minify: true,
                rollupOptions: {
                    input: resolve(__dirname, clientRoot, 'index.html')
                }
            },
            plugins: [
                react(),
            ],
            root: clientRoot,
        })
    }

    if (command === 'build') {
        return defineConfig({
            build: {
                sourcemap: false,
                write: true,
                emptyOutDir: true,
                minify: true,
            },
            plugins: [
                react(),
                viteStaticCopy({
                    targets: [
                        { src: copyAppscriptEntry, dest: './' },
                        { src: 'src/server/*', dest: 'server' }

                    ]
                }),
                buildClient(mode)
            ]
        })
    }

    return {};
}