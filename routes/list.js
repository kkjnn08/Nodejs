var router = require('express').Router();

//MongoDB
const mongoClient = require('mongodb').MongoClient;


var db;
// mongoClient.connect('mongodb+srv://admin:1234@cluster0.zaywpyx.mongodb.net/?retryWrites=true&w=majority', function(err, client){
mongoClient.connect(process.env.DB_URL, function(err, client){
    if(err){
        return console.log(err);
    }

    db = client.db('TodoApp');
    // db.collection('post').insertOne({todo : '잠자기', date : '11/17'}, function(err, result){
    //     console.log(result);
    //     console.log('저장완료');
    // })

    // app.listen(8080, function(){      //(port, 콜백함수)
    //     console.log('listening on 8080');
    // })
    
})

router.get('/list', function(req, res){
    // res.sendFile(__dirname + '/list.html')


    //MySQL
    // conn.query('select * from todo', function(err, rows, fields){
    //     if(err) throw err;
    
    //     res.send(rows);
    // });


    
    //db에 저장된 post라는 컬렉션의 데이터를 꺼내기
    // find함수로 가져온 데이터를 문자열화
    db.collection('post').find().toArray(function(err, result){
        console.log(result);
        res.render('list.ejs', {posts : result});
    });
    
});

module.exports = router;