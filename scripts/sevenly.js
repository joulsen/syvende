var legal_words = [];
var guesses = [];

function letter_construct(key){
    var span = $("<span></span>").text(key);
    var letter = $("<div class='letter'></div>").append(span);
    return letter
}

class Playset {
    constructor(word) {
        this.original = word;
        this.word = word;
        this.container = $(".playset > .letter-container");
        this.shuffle();
        this.load();
    }

    load() {
        this.container.empty();
        for (var i = 0; i < this.word.length; i++) {
            this.container.append(letter_construct(this.word[i]));
        }
    }

    shuffle() {
        this.word = this.word.split('').sort(function(){
            return 0.5 - Math.random()
        }).join('');
        this.load();
    }
}

class Input {
    constructor(word) {
        this.word = word;
        this.available = word.split('');
        this.container = $(".input > .letter-container");
    }

    get value() {
        return this.container.children().text();
    }

    add(letter) {
        if (!(this.value.length < this.word.length &&
              this.available.includes(letter))) {
            return false;
        }
        this.container.append(letter_construct(letter));
        const l_index = this.available.indexOf(letter);
        this.available.splice(l_index, 1);
        return true;
    }

    pop() {
        if (this.value) {
            var letter = this.container.find("div:last").detach();
            this.available.push(letter.text());
        }
        return Boolean(this.value);
    }

    clear() {
        this.container.empty();
        this.available = this.word.split('');
    }

    submit() {
        var input = this.value;
        this.clear();
        return input;
    }
}

class Game {
    constructor(word, legal_words) {
        this.word = word;
        this.legal = legal_words;
        this.guesses = [];
        this.scores = [];
        this.container = {
            score: $(".status > .score > .result"),
            guessleft: $(".status > .guesses-remaining > .result"),
            history: $(".results > .header")
        };
    }

    get score() {
        return this.scores.reduce((a, b) => a + b, 0);
    }

    get guesses_remaining() {
        return 5 - this.guesses.length;
    }

    word_is_legal(word) {
        return (this.legal.includes(word.toLowerCase()) &&
                !this.guesses.includes(word))
    }
    
    get_word_score(word) {
        if (this.word_is_legal(word)) {
            return [0, 1, 2, 3, 5, 8, 10, 20][word.length];
        }
        return 0
    }

    update_status() {
        this.container.score.text(this.score);
        this.container.guessleft.text(this.guesses_remaining);
    }

    update_history(word, score) {
        var guessObj = $("<span class='guess'></span>").text(word);
        var scoreObj = $("<span class='score'></span>").text(score);
        var entryObj = $("<div class='entry'></div>").append([guessObj, scoreObj]);
        if (score == 0) {
            entryObj.addClass("incorrect");
        }
        this.container.history.after(entryObj);
    }

    add_guess(guess) {
        var score = this.get_word_score(guess);
        this.guesses.push(guess);
        this.scores.push(score);
        this.update_history(guess, score);
        this.update_status();
    }
}


function game_begin(word){
    var game = new Game(word, legal_words)
    var playset = new Playset(word);
    var input = new Input(word);
    $(document).on("keypress", function(event){
        var key = String.fromCharCode(event.which).toUpperCase();
        input.add(key);
    })
    $(document).on("keydown", function(event){
        var key = event.which;
        if (event.which == 8) {
            input.pop();
        } else if (event.which == 27) {
            input.clear();
        } else if (event.which == 13) {
            var word = input.submit();
            game.add_guess(word);
        } else if (event.which == 32) {
            playset.shuffle();
        }
    })
    $("#shuffle").click(function(){
        playset.shuffle();
    })
}

$(document).ready(function(){
    const answer_length = 7;
    var response = $.get("words_da.txt", function(data){
        legal_words = data.split('\r\n');
        var max_length_words = legal_words.filter(function(word){
            return word.length == answer_length;
        })
        const now = new Date();
        const c = now.getFullYear(0) * 365 + now.getDay(0);
        var word = max_length_words[c % max_length_words.length];
        word = word.toUpperCase();
        game_begin(word, legal_words);
    })
})