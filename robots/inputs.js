const readline = require('readline-sync');
const state = require('./state');

function robot(){
  const content = {
    maximumSentences: 7
  };

  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix();
  content.lang = askAndReturnLang();
  state.save(content);

  function askAndReturnSearchTerm(){
    return readline.question('Type a Wikipedia search term: ');
  }

  function askAndReturnPrefix(){
    const prefixes = ['Who is', 'What is', 'The History of'];
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ');
    const selectedPrefixText = prefixes[selectedPrefixIndex];
    return selectedPrefixText;
  }

  function askAndReturnLang(){
    const prefixes = ['pt', 'en', 'es'];
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ');
    const selectedPrefixLang = prefixes[selectedPrefixIndex];
    return selectedPrefixLang;
  }
}

module.exports = robot;