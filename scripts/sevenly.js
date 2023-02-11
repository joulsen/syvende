var legal_words = [];
var guesses = [];

function letter_construct(letter){
    var score = $("<span class='score'></span>").text(get_letter_score(letter));
    var letter = $("<span class='letter'></span>").text(letter);
    var object = $("<div class='lettertile'></div>").append([letter, score]);
    return object
}

function get_letter_score(letter) {
    // ABCDEFGHIJKLMNOP(Q)RSTUV(W)XYZ
    const letter_scores = [1, 3, 8, 2, 1, 3, 3, 4, 3, 4, 3, 2, 3,
                           1, 2, 4, 0, 1, 2, 2, 3, 3, 0, 8, 4, 8];
    var charCode = letter.toUpperCase().charCodeAt();
    if (65 <= charCode && charCode <= 90) {
        return letter_scores[charCode - 65];
    //ÅÆØ
    } else if ([197, 198, 216].includes(charCode)){
        return 4;
    } else {
        return -1;
    }
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

class InputBox {
    constructor(word) {
        this.word = word;
        this.available = word.split('');
        this.container = $(".input > .letter-container");
    }

    get value() {
        return this.container.find(".letter").text();
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
            var lettertile = this.container.find("div:last").detach();
            this.available.push(lettertile.find(".letter").text());
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
            var score = word.split('');
            score.forEach(function(value, index){
                score[index] = get_letter_score(value);
            });
            score = score.reduce((a,b) => a + b, 0);
            if (word.length == this.word.length) {
                return score * 3;
            } else if (word.length == this.word.length - 1) {
                return score * 2;
            } else {
                return score;
            }
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

class Main {
    constructor(word, legal_words) {
        this.game = new Game(word, legal_words);
        this.playset = new Playset(word);
        this.inputbox = new InputBox(word);
        this.listen();
    }

    listen() {
        const self = this;
        $(document).on("keypress", function(event) {
            var key = String.fromCharCode(event.which).toUpperCase();
            if (!self.inputbox.add(key)) {
                return false;
            }
        });
        $(document).on("keydown", function(event){
            switch(event.which) {
                case 8:
                    return self.inputbox.pop();
                case 13:
                    let word = self.inputbox.submit();
                    return self.game.add_guess(word);
                case 27:
                    return self.inputbox.clear();
                case 32:
                    return self.playset.shuffle();
            }
            if (!self.game.guesses_remaining) {
                $(document).off("keypress");
                $(document).off("keydown");
                self.finish();
            }
        });
    }

    finish() {
        return true;
    }
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
        let main = new Main(word, legal_words);
    })
})
