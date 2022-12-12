//Express를 이용한 서버 구축
const express = require('express');
const app = express();

//미들웨어
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}))



//미들웨어, static file들은 public폴더에서 관리하겠다. (정적파일 예)이미지)
app.use('/public', express.static('public'))
//method override lib
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

//쿠키
const cookieParser = require('cookie-parser');
app.use(cookieParser());


//세션
const session = require('express-session');
//파일에 저장하기
const FileStore = require('session-file-store')(session);
//mysql
// const MySQLStore = require('express-mysql-session')(session);

// session filestore
app.use(session({
    secret: '1111',    //의미없는 번호
    resave: false,
    saveUninitialized: true,
    store : new FileStore()
}));

//session mysql store
// app.use(session({
//     secret: '1111',    //의미없는 번호
//     resave: false,
//     saveUninitialized: true,
//     store : new MySQLStore({
//         host : '127.0.0.1',
//         port : 3306,
//         user : 'root',
//         password : '123456',
//         database : 'node_db',
//     })
// }));

//md5
let md5 = require('md5');

//sha256
let sha256 = require('sha256');

//hasher
var bkpw = require('pbkdf2-password');
var hasher = bkpw();




//MySQL
const mysql = require('mysql');
const conn = mysql.createConnection({
    host : '127.0.0.1',
    user : 'root',
    password : '123456',
    database : 'node_db'
});

conn.connect();
console.log('mysql 접속 성공');


app.listen(8080, function(){      //(port, 콜백함수)
    console.log('listening on 8080');
})



//MongoDB
const mongoClient = require('mongodb').MongoClient;
//ejs
app.set('view engine', 'ejs');

var db;
mongoClient.connect('mongodb+srv://admin:1234@cluster0.zaywpyx.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    if(err){
        return console.log(err);
    }

    db = client.db('TodoApp');
    // db.collection('post').insertOne({todo : '잠자기', date : '11/17'}, function(err, result){
    //     console.log(result);
    //     console.log('저장완료');
    // })

    
})
//몽고db 접속 후 서버 오픈






// 라우터 get/post

app.get('/webtoon', function(req, res){
    res.send('웹툰을 서비스 해주는 페이지입니다.')
})

app.get('/game', function(req, res){
    res.send('게임을 서비스 해주는 페이지입니다.')
})

//home 라우터
app.get('/', (req, res) => {
    // res.sendFile(__dirname + '/index.html') //directory-name/index.html
    res.render('index.ejs')
})

app.get('/write', (req, res) => {
    // res.sendFile(__dirname + '/views/write.ejs') //directory-name/index.html
    res.render('write.ejs')
})

app.post('/add', function(req, res){
    console.log(req.body.title)     //body:bodyParser, name="title"
    console.log(req.body.date)      //body:bodyParser, name="date"
    
    // id는 넣지않아도 자동생성(증가)
    let sql = `
            insert into todo (title, curdate) values (
                "${req.body.title}",
                "${req.body.date}"
            )`;
    conn.query(sql, function(err, rows, fields){
        if(err){
            console.log(err);
        }else{
            res.redirect('/list');
        }
    })
});



app.get('/list', function(req, res){
    
    let sql = "select * from todo";
    let list = '';

    conn.query(sql, function(err, rows, fields){
        if(err){
            console.log(err);
        }else{
            // for(let i = 0; i < rows.length; i++)
            // {
            //     list += rows[i].title + " : " + rows[i].curdate + "<br/>";
            // }
            // res.send(list);
            console.log(rows);
            res.render("list_mysql.ejs", {posts : rows})
        }
    })
});


//list.ejs - ajax -> webServer - delete
//todo list에서 삭제버튼 누르면 삭제함.
app.delete('/delete', function(req, res){

    console.log(req.body._id);
    //string -> int
    req.body._id = parseInt(req.body._id);

    //req.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아 삭제하기
    //deleteOne(객체형식의데이터, 함수()))
    db.collection('post').deleteOne(req.body, function(){
        console.log('삭제 성공');

        //res : 응답
        //status : 성공(200)-실패(400-500) 여부를 알려줌
        res.status(200).send({message : '성공했습니다.'}) //상태 전달
        // res.status(400).send({message : '실패했습니다.'})
    }) 
});



//각 리스트의 상세페이지
//127.0.0.1:8080:/detail/1, /detail/2, /detail/3 ... 형태
//한 개의 ejs file로 여러개의 페이지 동적 구성 가능
//ejs file에 전달인자를 객체 형태로 넘겨주자.
app.get('/detail/:id', (req, res)=>{ // 여기서의 id : url의 parameter(매개변수)
    console.log('상세페이지', req.params.id)
    //req.params.id : 요청정보의 파라미터인 id
    db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result)=>{
        if(err) console.log(err)
        console.log(result)
        res.render('detail.ejs', {data: result}) 
    })
})

//write에서 수정버튼 클릭 이동 페이지
app.get('/edit/:id',(req, res)=>{
    console.log(req.params.id)

    db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result)=>{
        if(err) console.log(err)
        console.log(result)
        res.render('edit.ejs', {post: result})  
    })

})

//edit.ejs - form의 put요청(action)을 methodOverride방식으로 처리
app.put('/edit', (req, res)=>{
    //form의 todo, date 데이터를 db에 update
    console.log('업데이트 합니다.')
    db.collection('post').updateOne({_id: parseInt(req.body.id)}, {$set: {todo: req.body.title, date: req.body.date}}, (err, result)=>{
        if(err) console.log(err)
        console.log('수정 완료')
        res.redirect("/list");
    })
})
// conn.end()


//쿠키
// app.get('/count', function(req, res){
//     if(req.cookies.count){
//         var count = parseInt(req.cookies.count);
//     }else{
//         var count = 0;
//     }
//     count += 1;
//     res.cookie('count', count);
//     res.send('count : ' + count);
// })


//세션
app.get('/count', function(req, res){
    if(req.session.count){
        req.session.count++;
    }else{
        req.session.count = 1;
    }    
    res.send('count : ' + req.session.count);
})

app.get('/temp', function(req, res){
    // res.send('result : ' + req.session.count);
    res.send('result : ' + req.session.userid);
})


//로그인 라우터
app.get('/login',(req, res) => {
    res.render('login.ejs');
});

//md5 소금치기
// let salt = 'aoisdhaiugwuyg1hug18u23';

// app.post('/login',(req, res) => {
//     let userid = req.body.id;
//     let userpw = req.body.pw;

//     console.log(userid);
//     console.log(userpw);

//     let sql = "select * from login";
//     conn.query(sql, function(err, rows, fields){
//         if(err){
//             console.log(err)
//         }

//         console.log(rows);   //배열의 형태
//         console.log(rows.length);

//         for(let i = 0; i < rows.length; i++)
//         {
//             if(rows[i].userid == userid)
//             {
//                 console.log(md5(rows[i].userpw + salt));
//                 console.log(md5(userpw + salt));    
                
//                 if(md5(rows[i].userpw + salt) == md5(userpw + salt)){
//                     req.session.userid = userid;
//                     res.redirect('/');
//                 }else{
//                     res.send('비밀번호가 틀렸습니다.');
//                 }
//             }
//         }        
//     })
// });



//sha256
// app.post('/login',(req, res) => {
//     let userid = req.body.id;
//     let userpw = req.body.pw;

//     console.log(userid);
//     console.log(userpw);

//     let sql = "select * from login";
//     conn.query(sql, function(err, rows, fields){
//         if(err){
//             console.log(err)
//         }

//         console.log(rows);   //배열의 형태
//         console.log(rows.length);

//         for(let i = 0; i < rows.length; i++)
//         {
//             if(rows[i].userid == userid)
//             {
//                 console.log(sha256(rows[i].userpw));
//                 console.log(sha256(userpw));    
                
//                 if(sha256(rows[i].userpw) == sha256(userpw)){
//                     req.session.userid = userid;
//                     res.redirect('/');
//                 }else{
//                     res.send('비밀번호가 틀렸습니다.');
//                 }
//             }
//         }        
//     })
// });


//hashing
app.post('/login',(req, res) => {
    let userid = req.body.id;
    let userpw = req.body.pw;

    console.log(userid);
    console.log(userpw);

    let sql = "select * from login";
    conn.query(sql, function(err, rows, fields){
        if(err){
            console.log(err)
        }

        console.log(rows);   //배열의 형태
        console.log(rows.length);

        for(let i = 0; i < rows.length; i++)
        {
            console.log(rows[i].userid);

            if(rows[i].userid == userid)
            {
                return hasher({password : userpw, salt : rows[i].mobile}, function(err, pass, salt, hash){
                    console.log(pass);
                    console.log(salt);
                    console.log(hash);

                    if(hash === rows[i].userpw){
                        req.session.userid = userid;
                    res.redirect('/');
                    }else{
                        res.send('비밀번호가 틀렸습니다.');
                    }
                })
            }
        }        
    })
});


//회원가입 라우터
app.get('/signup',(req, res) => {
    res.render('signup.ejs');
});
app.post('/signup',(req, res) => {
    console.log(req.body.id); 
    console.log(req.body.pw);
    console.log(req.body.mobile);
    console.log(req.body.country);

    hasher({password : req.body.pw}, function(err, pass, salt, hash){
        console.log(pass);
        console.log(salt);
        console.log(hash);

        //암호화된 상태로 비번저장
        //소금도 저장해야 로그인시 조합되어 승인해줄 수 있다

        let sql = `
            insert into login (userid, userpw, mobile, country) 
            values (
                "${req.body.id}",
                "${hash}",  
                "${salt}",  ....

                "${req.body.country}"
            )`;
        conn.query(sql, function(err, rows, fields){
            if(err){
                console.log(err);
            }else{
                res.redirect('/login');
            }
        }) 
    })
});


//로그아웃
app.get('/logout', (req, res) => {
    // /count에서의 count값과 서버에서의 count값이 일치
    delete req.session.userid;
    res.redirect('/');
})