var language = "da";
var legal_words = [];
var guesses = [];

i18next.init({
    resources: {
        en: {
            translation: {
                "button-shuffle": "Shuffle letters",
                "button-clear": "Clear word",
                "button-submit": "Submit word",
                "status-score": "Total score",
                "status-guesses-remaining": "Guesses remaining",
                "history-guesses": "Guesses",
                "history-points": "Points",
            }
        },
        da: {
            translation: {
                "button-shuffle": "Bland bogstaver",
                "button-clear": "Ryd ord",
                "button-submit": "Spil ord",
                "status-score": "Total score",
                "status-guesses-remaining": "Gæt tilbage",
                "history-guesses": "Gæt",
                "history-points": "Points",
            }
        }
    }
});

function letter_construct(letter){
    var score = $("<span class='score'></span>").text(get_letter_score(letter));
    var letter = $("<span class='letter'></span>").text(letter);
    var object = $("<div class='lettertile'></div>").append([letter, score]);
    return object
}

function get_letter_score(letter) {
    // ABCDEFGHIJKLMNOP(Q)RSTUV(W)XYZ
    switch(language) {
        case "en":
            var letter_scores = [1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3,
                                   1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10]
            break;
        case "da":
            var letter_scores = [1, 3, 8, 2, 1, 3, 3, 4, 3, 4, 3, 2, 3,
                                   1, 2, 4, 0, 1, 2, 2, 3, 3, 0, 8, 4, 8];
    }
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
        this.controls = $(".controls");
        this.listen_keypress();
        this.listen_click();
    }

    guess() {
        let word = this.inputbox.submit();
        if (word) {
            return this.game.add_guess(word);
        }
    }

    handle_keypress(key) {
        switch(key) {
            case 8:
                return this.inputbox.pop();
            case 13:
                return this.guess();
            case 27:
                return this.inputbox.clear();
            case 32:
                return this.playset.shuffle();
            // ÆØÅ input is not received properly
            case 192:
                return this.inputbox.add("Æ");
            case 221:
                return this.inputbox.add("Å");
            case 222:
                return this.inputbox.add("Ø");
            default:
                let letter = String.fromCharCode(key).toUpperCase();
                return this.inputbox.add(letter);
        }
    }

    listen_keypress() {
        const self = this;
        $(document).on("keydown", function(event){
            self.handle_keypress(event.which);
            self.update_game_state();
        });
    }

    listen_click() {
        const self = this;
        this.playset.container.on("click", "> *", function(event) {
            self.inputbox.add($(this).find(".letter").text());
        });
        this.controls.on("click", "> *", function(event) {
            switch($(this).attr("id")) {
                case "shuffle":
                    self.playset.shuffle();
                    break;
                case "clear":
                    self.inputbox.clear();
                    break;
                case "submit":
                    self.guess();
            }
            self.update_game_state();
        })
    }

    update_game_state() {
        if (this.game.guesses_remaining <= 0) {
            this.deafen();
            this.finish();
            return true;
        }
        return false;
    }

    deafen() {
        console.log("deafen")
        $(document).off("keypress");
        $(document).off("keydown");
        this.playset.container.off("click", "> *");
        this.controls.off("click", "> *");
    }

    finish() {
        return true;
    }
}

$(document).ready(function(){
    const answer_length = 7;
    let footer_thanks = $("#footer-thanks");
    switch(language){
        case "en":
            var dictionary = "words_en.txt";
            i18next.changeLanguage("en");
            footer_thanks.html("Dictionary is constructed from the alpha word list provided by the people over at <a href='https://github.com/dwyl/english-words'>dwyl</a>. Thank you.")
            break;
        case "da":
            var dictionary = "words_da.txt";
            footer_thanks.html("Ordbogen er skabt ud fra <a href='https://korpus.dsl.dk/resources/details/flexikon.html'>flexikon</a> publiceret af Det Danske Sprog og Litteraturnævn. Mange tak.")
            i18next.changeLanguage("da");
    }
    $("[data-i18n]").each(function() {
        $(this).text(i18next.t($(this).attr("data-i18n")))
    })
    var response = $.get(dictionary, function(data){
        legal_words = data.split('\r\n');
        var max_length_words = legal_words.filter(function(word){
            return word.length == answer_length;
        })
        const now = new Date();
        const c = now.getFullYear(0) * 365 + now.getDay(0);
        var word = max_length_words[c % max_length_words.length];
        word = word.toUpperCase();
        let main = new Main(word, legal_words);
    });
})

$(window).on('load', (function() {
    $("body").fadeIn(500);
}));