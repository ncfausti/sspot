<img src="assets/logo.png" width="100%" />

<br>

<p>
  SaleSpot uses <a href="https://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://github.com/reactjs/react-router">React Router</a>, <a href="https://webpack.js.org/">Webpack</a> and <a href="https://www.npmjs.com/package/react-refresh">React Fast Refresh</a>.
</p>

<br>

<div align="center" style="display:none;">

[![Build Status][github-actions-status]][github-actions-url]
[![Dependency Status][david-image]][david-url]
[![DevDependency Status][david-dev-image]][david-dev-url]
[![Github Tag][github-tag-image]][github-tag-url]

[![OpenCollective](https://opencollective.com/electron-react-boilerplate/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/electron-react-boilerplate/sponsors/badge.svg)](#sponsors)
[![Good first issues open][good-first-issue-image]][good-first-issue-url]
[![StackOverflow][stackoverflow-img]][stackoverflow-url]

</div>

## Install

First, clone the repo via git and install dependencies:

```bash
yarn install
```

## Starting Development

Start the app in the `dev` environment:

```bash
yarn start
```

## Adding the Python Server

Create a `python3.7` virtual environment and install the required dependencies found in `min_requirements.txt`.
```bash
python3.7 -m venv pyserver
source pyserver/bin/activate
```

```bash
~(pyserver) python -m pip install pyinstaller

~(pyserver) python -m pip install -r min_requirements.txt
```
Create a single directory install for the python server.
```bash
~(pyserver) pyinstaller -D --paths pyserver/lib/python3.7/site-packages ws_server.py
```

Copy `basic_emotions`, `models.onxx`
to `dist/ws_sever/` (the folder created in the step above).

Copy the full `ws_server` folder to `assets/` in the project root.

You should now be able to package the app.

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```

Navigate to `<project-root>/release` and open the folder for the platform you are currently using to find the executable.

