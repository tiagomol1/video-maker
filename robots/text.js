const algorithmia = require('algorithmia'); // Machine learning
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey; //pega credencial de acesso ao algorithmia
const setenceBoundaryDetection = require('sbd'); //reconhece sentenças do texto

const watsonApikey = require('../credentials/watson-nlu.json').apikey;
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const  { IamAuthenticator }  =  require ( 'ibm-watson/auth' ) ;

const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: watsonApikey }),
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
  });

const state = require('./state');

async function robot(){

    const content = state.load();
    await fetchContentFromWikipedia(content); // função que busca texto do wikipedia
    sanitizeContent(content);
    breakContentIntoSentences(content);
    limitMaximumSentences(content);
    await fetchKeyWordsOfAllSentences(content);
    console.log(content)
    state.save(content);

    async function fetchContentFromWikipedia(content){
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey);
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2');
        const wikipediaResponde = await wikipediaAlgorithm.pipe({
            "lang": content.lang,
            "articleName": content.searchTerm
        });
        const wikipediaContent = wikipediaResponde.get();

        content.sourceContentOriginal = wikipediaContent.content;
    }

    function sanitizeContent(content){
        const withoutBlanksLinesAndMarkDown = removeBlankLinesAndMarkdown(content.sourceContentOriginal); //remove linhas em branco e marcações de partes da pagina
        const withouDatesInParentheses = removeDatesInParentheses(withoutBlanksLinesAndMarkDown);
        
        content.sourceContentSanitized = withouDatesInParentheses;

        function removeBlankLinesAndMarkdown(text){
            const allLines = text.split("\n");

            const  withoutBlanksLinesAndMarkDown = allLines.filter((line) => {
                if(line.trim().length === 0 || line.trim().startsWith('=')){
                    return false;
                }
                return true;
            })

            return withoutBlanksLinesAndMarkDown.join(' ');
        }

        function removeDatesInParentheses(text){
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ');
        }
    }

    function breakContentIntoSentences(content){
        content.sentences = [];

        const sentences = setenceBoundaryDetection.sentences(content.sourceContentSanitized);
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })

    }

    function limitMaximumSentences(content){
        content.sentences = content.sentences.slice(0, content.maximumSentences);
    }

    async function fetchKeyWordsOfAllSentences(content){
        for(const sentence of content.sentences){
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);
        }
    }

    async function fetchWatsonAndReturnKeywords(sentence){
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if(error){
                    throw error;
                }
                // console.log(JSON.stringify(reponse.result.keywords, null, 4));
                const keywords = response.result.keywords.map((keyword) => {
                    return keyword.text;
                });

                resolve(keywords);
            });
        });
    }
    
}

module.exports = robot;