require('dotenv').config();
const axios = require('axios');
const log = require('log-to-file');

module.exports = class API {

    async DeleteTasks(arr) {

        let data = JSON.stringify({
            'api_key': process.env.API_KEY,
            'tasks_list': arr
        });

        let config = {
            method: 'delete',
            maxBodyLength: Infinity,
            url: process.env.API_URL + '/api/v1/tasks',
            headers: {
                'Content-Type': 'application/json'
            },
            data : data
        };

        return await axios.request(config)
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    async GetToken(text) {
        let data = JSON.stringify({
            'api_key': process.env.API_KEY,
            'max_tokens': 1024,
            'text': text
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.API_URL + '/api/v1/split-text',
            headers: {
                'Content-Type': 'application/json'
            },
            data : data
        }

        return await axios.request(config)
            .then((response) => {
                return response.data.result;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    async CreateTask(model, prompt, temperature, length) {

        let data = JSON.stringify({
            'api_key': process.env.API_KEY,
            'model_name': model,
            'prompt': prompt,
            'num_beams': 5,
            'temperature': temperature,
            'mode': 'full_generation',
            'top_k': 50,
            'top_p': 1.0,
            'length': length,
            'stop_words': ["\n"],
            'no_repeat_ngram_size': 5,
            'tokens_per_attempt': 128,
            'prompt_in_result': false
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.API_URL + '/api/v1/generate',
            headers: {
                'Content-Type': 'application/json'
            },
            data : data
        }

        return await axios.request(config)
            .then((response) => {
                log(JSON.stringify(response.data));
                return response.data.task_id;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    async GetTask(taskId) {

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: process.env.API_URL + '/api/v1/tasks/' + taskId,
            headers: { }
        }

        return await axios.request(config)
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    async GetHtml(url) {

        return await axios.get(url)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error);
            });
    }
}