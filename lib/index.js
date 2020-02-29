const fs = require('fs');
const axios = require('axios');

const Ada = function(gitlabUrl, projectId, token, apiVersion, stageName){
    this._gitlabUrl = gitlabUrl;
    this._projectId = projectId;
    this._token = token;
    this._apiVersion = apiVersion || 4;
    this._stageName = stageName || '';
};

Ada.prototype.getPipelineId = async function(commitId){
    const token = this._token;
    const projectId = this._projectId;
    const url = `${this._gitlabUrl}/api/v${this._apiVersion}/projects/${projectId}/repository/commits/${commitId}?private_token=${token}`;
    const response = await axios.get(url);
    if(response.status !== 200){
        throw new Error('request error with status code:' + response.status);
    }
    if(!response.data || !response.data.last_pipeline){
        throw new Error('no pipeline avaiable.');
    }
    const pipelineId = response.data.last_pipeline.id;

    return pipelineId;
};

Ada.prototype.getJobId = async function(pipelineId){
    const token = this._token;
    const projectId = this._projectId;
    const url = `${this._gitlabUrl}/api/v${this._apiVersion}/projects/${projectId}/pipelines/${pipelineId}/jobs?private_token=${token}&scope=success`;
    const response = await axios.get(url);
    if(response.status !== 200){
        throw new Error('request error with status code:' + response.status);
    }
    const validJobs = response.data && response.data
        .filter(job => Date.now() < Date.parse(job.artifacts_expire_at).valueOf())
        .sort((job1, job2) => new Date(job2.finished_at) - new Date(job1.finished_at));

    const job = validJobs.filter(({stage}) => {
        return stage === this._stageName;
    })[0] || validJobs[0];

    if(!job){
        throw new Error('no success build jobs.');
    }
    return job.id;
};

Ada.prototype.downloadArtifacts = async function(jobId, path){
    const token = this._token;
    const projectId = this._projectId;
    const url = `${this._gitlabUrl}/api/v${this._apiVersion}/projects/${projectId}/jobs/${jobId}/artifacts?private_token=${token}`;
    console.log(url);
    const response = await axios.get(url, {
        responseType: 'stream'
    });
    const file = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        response.data.pipe(file).on('finish', resolve);
    });
};

Ada.prototype.download = async function(commitId, path){
    const pipelineId = await this.getPipelineId(commitId);
    const jobId = await this.getJobId(pipelineId);
    await this.downloadArtifacts(jobId, path);
};

module.exports = Ada;
