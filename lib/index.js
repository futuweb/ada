const fs = require('fs');
const axios = require('axios');

const Ada = function(gitlabUrl, projectId, token, apiVersion, stageName){
    this._gitlabUrl = gitlabUrl;
    this._projectId = projectId;
    this._token = token;
    this._apiVersion = apiVersion || 4;
    this._stageName = stageName || 0;
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
    const url = `${this._gitlabUrl}/api/v${this._apiVersion}/projects/${projectId}/pipelines/${pipelineId}/jobs?private_token=${token}`;
    const response = await axios.get(url);
    if(response.status !== 200){
        throw new Error('request error with status code:' + response.status);
    }
    const jobs = response.data && response.data.filter((job) => {
        return job.status === 'success';
    });

    let job = jobs[0];
    if (this._stageName) {
        jobs.some(successJob => {
            const isMatch = successJob.stage === this._stageName;
            if (isMatch) {
                job = successJob;
            }
            return isMatch;
        });
    }

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
