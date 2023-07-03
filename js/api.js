require('dotenv').config();
const axios = require('axios');
const log = require('log-to-file');

module.exports = class API {

    async SendRequest(text) {

        const axios = require('axios');
        let content = "Your task is to read the text and determine the category of this text. The list of categories is fixed and cannot be changed or expanded: Art and Culture\nArt Galleries and Exhibitions\nAstrology and Horoscopes\nAutomotive\nBeauty and Skincare Products\nBlogs\nBusiness and Corporate\nComedy and Humor\nCommunity and Forums\nCommunity Support and Help\nDating and Relationships\nDIY and Crafts\nE-commerce\nEducation\nEducation Resources\nEntertainment\nEnvironmental and Sustainability\nEnvironmental Conservation\nFashion and Beauty\nFashion and Style Blogs\nFinancial Planning and Advice\nFinancial Services\nFitness and Wellness\nFood and Cooking\nGaming\nGardening and Landscaping\nGovernment and Public Services\nGovernment Services and Forms\nHealth and Fitness\nHealth and Medical Information\nHistory and Archaeology\nHome and Interior Design\nJob and Career\nLaw and Legal Services\nLiterature and Writing\nMusic\nMusic Streaming and Downloads\nNews and Media\nNon-profit and Charity\nOnline Learning and Courses\nParenting and Family\nParenting Tips and Advice\nPersonal Finance and Budgeting\nPersonal Portfolio\nPets and Animals\nPhotography\nReal Estate\nRecipe Sharing and Cooking Tips\nReligion and Spirituality\nScience and Technology\nSocial Networking\nSoftware and App Development\nSports\nTechnology\nTechnology Reviews\nTravel and Tourism\nTravel Guides and Reviews\nWedding and Events\nWedding Planning and Ideas\nWildlife and Nature Conservation\nYour text:\n" + text;
        let data = JSON.stringify({
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'user',
                    'content': content
                }
            ],
            'temperature': 0.7
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'OpenAI-Organization': 'org-9mOqsbsTHxQCoLFCtIu8JXA9',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.CHAT_GPT_KEY
            },
            data : data
        };

        return await axios.request(config)
            .then((response) => {
                const result = {
                    'data': response.data,
                    'content': content
                }
                log(JSON.stringify(result));
                return response.data
            })
            .catch((error) => {
                log(JSON.stringify(error));
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