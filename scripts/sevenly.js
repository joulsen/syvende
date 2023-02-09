var legal_words = [];
var guesses = [];

function letter_construct(key){
    var span = $("<span></span>").text(key);
    var letter = $("<div class='letter'></div>").append(span);
    return letter
}


function playset_load(word){
    var playset = $(".playset > .letter-container");
    playset.empty();
    for (var i = 0; i < word.length; i++) {
        playset.append(letter_construct(word[i]));
    }
}

function playset_shuffle(word){
    var shuffle = word.split('').sort(function(){
        return 0.5 - Math.random()
    }).join('');
    playset_load(shuffle);
}

function input_add(word, key, available){
    if (!(input_get().length < word.length && available.includes(key))) {
        return false
    }
    $(".input > .letter-container").append(letter_construct(key));
    const l_index = available.indexOf(key);
    available.splice(l_index, 1);
    return available;
}

function input_pop(available){
    var letter = $(".input > .letter-container").find("div:last").detach();
    available.push(letter.text());
    return available;
}

function input_clear(word, available){
    $(".input > .letter-container").empty();
    available = word.split('');
    return available
}

function input_get(){
    return $(".input > .letter-container").children().text();
}

function word_legal(word){
    return (legal_words.includes(word.toLowerCase()) && !guesses.includes(word))
}

function get_word_score(word){
    if (word_legal(word)) {
        return [0, 1, 2, 3, 5, 8, 10, 20][word.length];
    } else {
        return 0
    }
}

function status_set(score, guesses){
    $(".status > .score > .result").text(score);
    $(".status > .guesses-remaining > .result").text(guesses);
}

function update_guesses(guesses){
}

function add_guess_entry(input, score){
    var guessObj = $("<span class='guess'></span>").text(input);
    var scoreObj = $("<span class='score'></span>").text(score);
    var entryObj = $("<div class='entry'></div>").append([guessObj, scoreObj]);
    if (score == 0) {
        entryObj.addClass("incorrect");
    }
    $(".results > .header").after(entryObj);
}

function input_submit(word, available){
    var input = input_get();
    if (input) {
        var score = get_word_score(input);
        var total_score = $(".status > .score > .result")
        add_guess_entry(input, score);
        guesses.push(input);
        return score
    } else {
        return 0;
    }
}

function game_begin(word){
    playset_shuffle(word);
    var score = 0;
    var guesses_remaining = 5;
    available = word.split('');
    $(document).on("keypress", function(event){
        var key = String.fromCharCode(event.which).toUpperCase();
        input_add(word, key, available);
    })
    $(document).on("keydown", function(event){
        if (event.which == 8 || event.which == 46) {
            available = input_pop(available);
        } else if (event.which == 27) {
            available = input_clear(word, available);
        } else if (event.which == 13) {
            score += input_submit(word, available);
            guesses_remaining -= 1;
            status_set(score, guesses_remaining);
            available = input_clear(word, available);
        } else if (event.which == 32) {
            playset_shuffle(word);
        }
    })
    $("#shuffle").click(function(){
        playset_shuffle(word);
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