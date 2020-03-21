var mongoclient = require('mongodb').MongoClient;
var intra = require('./request_intra').intraControler;
var dbb;
var intra;
var urli = "mongodb+srv://gufortel:admin@guforteltest-7hhbj.gcp.mongodb.net/test?retryWrites=true&w=majority"

function mongo_connect() {
    mongoclient.connect(urli, { useUnifiedTopology: true }, function(err, dbe) {
        if (err){
            console.log("error db : " + err);
        }
        console.log("connected");
        dbb = dbe.db("user");
        list_user();
    });
}
async function app() {
    intra = new intra();
    mongo_connect();
}

async function list_user() {
    var i = 1;
    while(1) {
        var json = await intra.request_intra("https://api.intra.42.fr/v2/campus/1/users" + "?page[size]=100&page[number]=" + i).catch(function(error) {
            console.log(error);
            process.exit(0);
        });
        console.log(json[0]);
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
    var json = await intra.request_intra(url).catch(function (error) {
        if (error.statusCode !== 404)
            console.log(error);
        return(0);
    });
    console.log(json.id, json.login, json.pool_year);
    if (!(json) || (json.pool_year != "2020" && json.pool_year != "2019" && json.pool_year != "2018" && json.pool_year != "2017"))
        return(0);
    if (json.pool_year == "2016")
        return(-1);
    //console.log("-----Save");
    dbb.collection('user').updateOne({"id":json.id}, {$set: json}, {upsert: true}, function(err, res) {
        if (err)
            console.log(err);
    });
    var tabPositions = await takePositions(json.id);
    var j = 0;
    while (tabPositions[j]){
        dbb.collection('positions').updateOne({"id": tabPositions[j].id}, {$set: {id: tabPositions[j].id, positions: tabPositions[j]}}, {upsert: true}, function(err, res) {
            if (err)
                console.log(err);
        });
        j++;
    }
    return(0);
}

async function takePositions(id) {
    var i = 1;
	var tab = [];
	while(1){
        var json = await intra.request_intra("https://api.intra.42.fr/v2/users/" + id + "/locations" + "?page[size]=100&page[number]=" + i).catch(function (e) {
            console.log(e);
            return(tab);
        });
        if (json.length == 0){
            return(tab);
        }
        tab = tab.concat(json);
		i++;
	}
}

app();