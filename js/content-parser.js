const ExcelJS = require('exceljs');
const Swal = require('sweetalert2');
const excelToJson = require('convert-excel-to-json');
const sequelize = require('./db');
const { Page } = require('./models');
const API = require('./api');
const cheerio = require('cheerio');

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

    constructor() {
        this.InitEvents();
        this.ConnectToDB().then(() => {});
    }

    InitEvents() {
        this.uploadButton.addEventListener('change', this.UploadFile.bind(this));
        this.generatorButton.addEventListener('click', this.StartGenerator.bind(this));
        this.saveDocument.addEventListener('click', this.SaveDocument.bind(this));
    }

    StartGenerator() {
        this.generatorButton.setAttribute('disabled', 'disabled');

        this.LoadPages().then((pages) => {
            this.CategoryGenerator(pages).then(() => {});
        });
    }

    async CategoryGenerator(pages) {

        const maxJobsCount = pages.length;
        const api = new API();

        this.listOfSamples.classList.remove('hidden');

        for (const index in pages) {

            let id = pages[index].dataValues.id;
            let text = pages[index].dataValues.text;
            let url = pages[index].dataValues.url;
            let html = `<tr class="task-${id}"><td>${id}</td><td>${url}</td><td class="category">-</td><td class="status">PENDING</td></tr>`;

            this.tableBody.insertAdjacentHTML('beforeend', html);
            const tableWrap = document.querySelector('.table-wrap');

            tableWrap.scrollTop = tableWrap.scrollHeight;

            await api.SendRequest(text).then(async (data) => {

                const num = parseInt(index) + 1;
                const width = (num / maxJobsCount) * 100;
                this.progressBar.style.width = width + '%';

                if (data.choices) {
                    const category = data.choices[0].message.content.replace(/^Category: /g, '');
                    document.querySelector('.task-' + id + ' .category').innerHTML = category;
                    document.querySelector('.task-' + id + ' .status').innerHTML = 'SUCCESS';

                    // Update page
                    await Page.update({ category: category }, {
                        where: {
                            id: id
                        }
                    });

                    if (width === 100)  {
                        Swal.fire('Task complited successfully!');
                    }
                }
            });
        }
    }

    async LoadPages() {

        return await Page.findAll({
            attributes: ['id', 'url', 'text', 'category']
        });
    }

    GetData(html) {

        let data = [];
        const $ = cheerio.load(html);

        data.push({
            title : $('h1').text()
        });

        $('p').each((i, elem) => {
            if ($(elem).text().length > 200) {
                data.push({
                    title : $(elem).text()
                });
            }
        });

        let result = '';
        for (let index in data) {
            if (index > 2) break;
            result += data[index].title + '\n';
        }
        return result;
    }

    /**
     * Save sample
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

        this.SaveSamples(data, arrayLength).then(() => {
            setTimeout(() => {
                Swal.fire('File loaded successfully!');
                this.fileLoader.classList.add('hidden');
                this.fileGenerator.classList.remove('hidden');
            }, 1000);
        });
    }

    async SaveSamples(data, arrayLength) {

        const api = new API();

        for (const index in data) {

            const num = parseInt(index);
            if (!num || !data[index]['A']) continue;

            await api.GetHtml(data[index]['A']).then(async result => {
                let text = this.GetData(result);
                await Page.create({ url: data[index]['A'], text: text }).then(() => {
                    const width = (num / arrayLength) * 100;
                    this.progressLoader.style.width = width + '%';
                });
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
                { header: 'Url', key: 'url', width: 40 },
                { header: 'Text', key: 'text', width: 100 },
                { header: 'Category', key: 'category', width: 40 }
            ];

            sheet.getRow(1).font = { bold: true };

            pages.map(value => {
                sheet.addRow({
                    url: value.dataValues.url,
                    text: value.dataValues.text,
                    category: value.dataValues.category,
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