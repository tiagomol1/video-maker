const imageDownloader =  require('image-downloader');
const imageIgnore = require('../ignore.json').images;
const google = require('googleapis').google;
const customSearch = google.customsearch('v1'); 
const state = require('./state.js');

const googleSearchCredentials = require('../credentials/google-search.json');

async function robot(){
  const content = state.load();

  await fetchImagesOfAllSentences(content);
  await downloadAllImages(content);
  state.save(content);

  async function fetchImagesOfAllSentences(content){
    const lang = content.lang;
    for(const sentence of content.sentences){

      let query = `${content.searchTerm} ${sentence.keywords[0]}`;

      const searcTerm = content.searchTerm.split(' ');
      if(searcTerm.length = 1){
        if(sentence.keywords[0].indexOf(searcTerm) != -1){
          query = `${content.searchTerm}`;
        }
      }else{
        if(sentence.keywords[0].indexOf(searcTerm[0]) != -1 && sentence.keywords[0].indexOf(searcTerm[1]) != -1){
          query = `${content.searchTerm}`;
        }
      }

      sentence.images = await fetchGoogleAndReturnImagesLinks(query, lang);

      sentence.googleSearchQuery = query;
    }
  }

  async function fetchGoogleAndReturnImagesLinks(query, lang){
    if(lang = 'pt') lang = 'pt-BR';
    const response = await customSearch.cse.list({
      auth: googleSearchCredentials.apiKey,
      cx: googleSearchCredentials.searchEngineId,
      q: `${query}`,
      searchType: 'image',
      imgSize: 'huge',
      num: 3,
      hl: lang
    });

    const imagesUrl = response.data.items.map((item) => {
      return item.link;
    })

    return imagesUrl;
  }

  async function downloadAllImages(content){
    content.downloadedImages = [];

    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      const images = content.sentences[sentenceIndex].images;

      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imageUrl = images[imageIndex];
        
        try{

          if(content.downloadedImages.includes(imageUrl)){
            throw new Error('Imagem já foi baixada.');
          }

          for(let ignoreImageIndex = 0; ignoreImageIndex < imageIgnore.length; ignoreImageIndex++){
            if(imageUrl == imageIgnore[ignoreImageIndex]){
              throw new Error('Imagem deve ser ignorada.');
            }
          }

          await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
          content.downloadedImages.push(imageUrl);
          console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imageUrl}`);
          break;

        }catch(error){

          console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar imagem ${imageUrl}: ${error}`);

        }

      }
    }
  }

  async function downloadAndSave(url, filename){
    return imageDownloader.image({
      url: url,
      dest: `./content/${filename}`
    });
  }

}

module.exports = robot;