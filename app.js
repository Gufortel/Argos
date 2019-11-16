var rq = require('sync-request');
var mongoclient = require('mongodb').MongoClient;
var dbb;
var token;
var dbclose;
var urli = "mongodb+srv://gufortel:admin@guforteltest-7hhbj.gcp.mongodb.net/test?retryWrites=true&w=majority"

function mongo_connect() {
    mongoclient.connect(urli, { useUnifiedTopology: true }, function(err, dbe) {
        if (err){
            console.log(err);
        }
        console.log("connected");
        try{
            dbb = dbe.db("user");
            dbclose = dbe;
            var obj = {name: "test", address: "test", "test": "lol"};
        }catch(e){
            throw e;
        }
        list_user();
    });
}
async function app() {
    token = connexion();
    mongo_connect();
}

function connexion() {
    var request = rq("POST", "https://api.intra.42.fr/oauth/token", {
        json:{
            "grant_type":"client_credentials",
            "client_id":"a240d44cba74426f9ee83c9c3271e985740075e01ceee55e007550a46badaa3d",
            "client_secret":"0644c6df34f448a0b0c50a539716b81b7fd491afcf6314579b6d99101bddfe46"
        }
    });
    var body = JSON.parse(request.getBody('utf8'));
    var access_token = body.access_token;
    return(access_token);
}

async function list_user() {
    var i = 0;
    while(1) {
        var json = await request_intra("https://api.intra.42.fr/v2/campus/1/users" + "?page[number]=" + i).catch(function(error) {
            console.log(error);
            process.exit(0);
        });
        for (let page = 0; page < json.length; page++) {
            const user = json[page].url;
            if (await save_user(user) == -1){
                console.log("finish!");
                return;
            }
        }
        i++;
    }
}

async function save_user(url) {
    var json = await request_intra(url).catch(function (error) {
        console.log(error);
    });
    if (!(json) || json.pool_year != "2019" || json.pool_year != "2018" || json.pool_year != "2017")
        return(0);
    if (json.pool_year == "2016")
        return(-1);
    console.log(json.id, json.login);
    dbb.collection('user').updateOne({"id":json.id}, {$set: json}, {upsert: true}, function(err, res) {
        if (err)
            throw err;
    });
    return(0);
}

async function request_intra(path) {
    try{
        var request = rq("GET", path, {
            headers:{
                'Authorization': "Bearer " + token
            }
        });
    }catch(e){
        return(new Promise((resolve, reject) => (reject(e))));
    }
    if (request.statusCode == 429){
        //console.log(request.headers);
        console.log(request.headers['retry-after'] * 1000);
        await sleep(request.headers['retry-after'] * 1000);
        return (request_intra(path));
    }
    if (request.statusCode == 401){
        token = connexion();
        return(request_intra(path));
    }
    //console.log(JSON.parse(request.statusCode));
    //console.log(JSON.parse(request.getBody()));
    return(new Promise(resolve => (resolve(JSON.parse(request.getBody())))));
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}
app();