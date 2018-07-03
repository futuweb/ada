#!/usr/bin/env node
const parseArgs = require('minimist');
const args = parseArgs(process.argv);
const path  = require('path');
const Ada = require('../lib/index');

const gitlabUrl = args.gitlab || args.g;
const projectId = args.project || args.p;
const token = args.token || args.t;
const commitId = args.commit || args.c;
const filePath = path.resolve(args.output || args.o || 'artifacts.zip');

const help = `
Ada: donwload artifacts of Gitlab CI pipelines/jobs.

Arguments:

    --gitlab    -g     Gitlab http(s) url
    --project   -p     Project id
    --token     -t     Gitlab private token
    --commit    -c     Commit id
    --output    -o     Output file (default: ./artifacts.zip)
`

if(!projectId || !token || !commitId){
    console.log(help);
    process.exit(1);
}

const ada = new Ada(gitlabUrl, projectId, token);
console.log('ready to download.');
ada.download(commitId, filePath).then(() => {
    console.log('artifacts saved: ' + filePath);
    process.exit(0);
},(err) => {
    console.log(err.message);
    process.exit(1);
});
