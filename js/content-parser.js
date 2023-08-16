const ExcelJS = require('exceljs');
const Swal = require('sweetalert2');
const excelToJson = require('convert-excel-to-json');
const sequelize = require('./db');
const { Page, Job } = require('./models');
const API = require('./api');
const cheerio = require('cheerio');
const {logger} = require("sequelize/lib/utils/logger");

class ContentParser {

    fileLoader = document.querySelector('.file-loader');
    fileLoaderWrap = document.querySelector('.file-loader-wrap');
    fileGenerator = document.querySelector('.file-generator');
    uploadButton = document.querySelector('#upload');
    progressLoader = document.querySelector('.upload-progress .progress-bar');
    generatorButton = document.querySelector('#generate');
    listOfSamples = document.querySelector('.list-of-samples');
    tableBody = document.querySelector('.table-body');
    progressBar = document.querySelector('.task-progress .progress-bar');
    saveDocument = document.querySelector('#save_document');
    clearTasks = document.querySelector('#clear_tasks');

    constructor() {
        this.InitEvents();
        this.ConnectToDB().then(() => {});
    }

    InitEvents() {
        this.uploadButton.addEventListener('change', this.UploadFile.bind(this));
        this.generatorButton.addEventListener('click', this.StartGenerator.bind(this));
        this.saveDocument.addEventListener('click', this.SaveDocument.bind(this));
        this.clearTasks.addEventListener('click', this.ClearTasks.bind(this));
    }

    /**
     * Remove tasks
     * */
    async ClearTasks () {
        Swal.fire({
            title: 'Do you want to remove all tasks?',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Yes',
            denyButtonText: 'No',
        }).then(async(result) => {

            if (result.isConfirmed) {

                await Job.findAll({
                    attributes: ['name'],
                    where: {
                        status: 'PENDING'
                    }
                }).then(async jobs => {

                    let arr = [];
                    for (const index in jobs) {
                        arr.push(jobs[index].dataValues.name);
                    }

                    if (arr.length) {
                        const api = new API();
                        await api.DeleteTasks(arr).then(result => {
                            if (result.status === 'success') {
                                window.location = location.href;
                            }
                        });
                    } else {
                        window.location = location.href;
                    }
                });
            }
        });
    }

    /**
     * Clear uncategorized
     * */
    ClearUncategorized(text) {
        let arr = text.split(',');
        let newArr = [];
        arr.map(value => {
            let re = /uncategorized/g;
            let found = value.match(re);
            if (!found) {
                newArr.push(value.trim());
            }
        });
        return newArr.toString();
    }

    /**
     * Category generator
     * */
    StartGenerator() {
        this.generatorButton.setAttribute('disabled', 'disabled');
        this.clearTasks.removeAttribute('disabled');

        this.LoadPages().then((pages) => {
            this.CategoryGenerator(pages).then(() => {});
        });
    }

    /**
     * Load pages
     * */
    async LoadPages() {

        return await Page.findAll({
            attributes: ['id', 'url', 'domain','token', 'title', 'category']
        });
    }

    /**
     * Start category generator
     * */
    async CategoryGenerator(pages) {

        const maxJobsCount = pages.length;
        const api = new API();

        for (const index in pages) {

            const num = parseInt(index) + 1;
            const pageId = pages[index].dataValues.id;
            const title = pages[index].dataValues.title;
            const token = pages[index].dataValues.token;
            const prompt = "### Title ###\n" + title + "\n### Text ###\n" + token + "\n### Categories ###\n";

            await api.CreateTask("11c99046-f22c-4c37-9d45-1d1db248ab1f", prompt, 0.9, 128).then(taskId => {

                this.SaveJob(taskId, 'CategoryGenerator', pageId).then(() => {});

                let html = `<tr class="task-${taskId}"><td>${taskId}</td><td>CategoryGenerator</td><td class="status">PENDING</td></tr>`;
                setTimeout(() => {
                    this.tableBody.insertAdjacentHTML('beforeend', html);
                }, 500);

                this.startTimer(taskId, maxJobsCount, num, pageId);
            });
        }

        this.listOfSamples.classList.remove('hidden');
    }

    /**
     * Save job
     * */
    async SaveJob(name, type, pageId) {

        await Job.create({ name, type, pageId });
    }

    /**
     * Start timer
     * */
    startTimer(taskId, maxJobsCount, num, pageId, token = false) {

        const api = new API();

        let timerId = setInterval(() => {

            api.GetTask(taskId).then(async result => {

                if (result.task_status === 'SUCCESS') {

                    await Job.findOne({
                        where: {
                            name: taskId
                        }
                    });

                    await Job.update({ status: result.task_status }, {
                        where: {
                            name: taskId
                        }
                    });

                    await Page.update({ category: this.ClearUncategorized(result.task_result) }, {
                        where: {
                            id: pageId
                        }
                    });

                    document.querySelector('tr.task-' + taskId + ' .status').innerHTML = result.task_status;

                    const width = (num / maxJobsCount) * 100;
                    this.progressBar.style.width = width + '%';

                    let tableWrap = document.querySelector('.table-wrap');
                    tableWrap.scrollTop = tableWrap.scrollHeight;

                    if (width === 100)  {
                        Swal.fire('Task completed successfully!');
                        this.generatorButton.removeAttribute('disabled');
                    }

                    clearInterval(timerId);
                }
            });
        }, 5000);
    }

    /**
     * Upload file
     * */
    UploadFile(event) {
        const file = event.target.files[0];
        const result = excelToJson({
            sourceFile: file.path
        });

        const keys = Object.keys(result);
        const firstKey = keys[0];
        const data = result[firstKey];
        const arrayLength = data.length - 1;

        event.target.setAttribute('disabled', 'disabled');
        this.fileLoaderWrap.classList.add('disabled');

        this.SavePages(data, arrayLength).then(() => {
            setTimeout(() => {
                Swal.fire('File loaded successfully!');
                this.fileLoader.classList.add('hidden');
                this.fileGenerator.classList.remove('hidden');
            }, 1000);
        });
    }

    /**
     * Save pages
     * */
    async SavePages(data, arrayLength) {

        const api = new API();

        for (const index in data) {

            const num = parseInt(index);
            if (!num || !data[index]['A']) continue;

            await api.GetHtml(data[index]['A']).then(async result => {

                if (result) {

                    let content = this.GetData(result);

                    const page = await Page.create({
                        url: data[index]['A'],
                        domain: data[index]['B'],
                        title: content.title
                    });

                    await api.GetToken(content.text).then(async token => {

                        await Page.update({ token: token[0] }, {
                            where: {
                                id: page.id
                            }
                        }).then(() => {
                            const width = (num / arrayLength) * 100;
                            this.progressLoader.style.width = width + '%';
                        });
                    });
                }
            });
        }
    }

    /**
     * Save document
     * */
    async SaveDocument() {

        this.LoadPages().then(async (pages) => {

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Sheet1');

            sheet.columns = [
                { header: 'Url', key: 'url', width: 100 },
                { header: 'Domain', key: 'domain', width: 40 },
                { header: 'Topic', key: 'topic', width: 60 }
            ];

            sheet.getRow(1).font = { bold: true };

            pages.map(value => {
                sheet.addRow({
                    url: value.dataValues.url,
                    domain: value.dataValues.domain,
                    topic: value.dataValues.category,
                });
            });

            await workbook.xlsx.writeBuffer().then(function (data) {
                const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } );
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'result.xlsx'
                link.click();
                link.remove();
            });
        });
    }

    /**
     * Prepare content from html
     * */
    GetData(html) {

        let data = [];
        let result = {
            'title': '',
            'text': ''
        };
        const $ = cheerio.load(html);

        result.title = $('h1').text();

        $('p').each((i, elem) => {
            if ($(elem).text().length > 200) {
                data.push({
                    title : $(elem).text()
                });
            }
        });

        let text = '';
        for (let index in data) {
            if (index > 5) break;
            text += data[index].title + '\n';
        }
        result.text = text;

        return result;
    }

    /**
     * Connect to DB
     * */
    async ConnectToDB() {

        try {
            await sequelize.authenticate();
            await sequelize.sync();
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new ContentParser();