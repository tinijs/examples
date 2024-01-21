# TiniJS Skeleton 

The base structure of a TiniJS app.

## Install

You can create an app automatically with the help of the CLI or manually creating it.

Using the CLI (recommended):

`npx @tinijs/cli new my-app --latest`

Or, manually:

- Download or this repo: `git clone https://github.com/tinijs/skeleton.git`
- Run: `cd skeleton && npm i`

## Develop & build

- `npm run dev`: to start the development serve.
- `npm run build`: to build the production package.
- `npm run preview`: to preview the production build locally.

To access the app from other devices on the same network:

- Run `ifconfig` to retrieve the IP of the host machine.
- Preview the app: `192.168.1.XXX:3000`

## Developement

- Create a home for TiniJS: `mkdir TiniJS && cd TiniJS`
- Install the CLI: `npm i -g @tinijs/cli`
- Fork the repo
- Install dependencies: `cd skeleton && npm i`
- Make changes & preview: `npm run dev`
- Push changes & create a PR 👌

## License

**@tinijs/skeleton** is released under the [MIT](https://github.com/tinijs/skeleton/blob/master/LICENSE) license.
