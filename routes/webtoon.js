var router = require('express').Router();

//전역 login 기능
router.use('/webtoon', islogin);

router.get('/webtoon/drama', function(req, res){
    res.send('웹툰의 드라마 페이지입니다.')
})

router.get('/webtoon/action', function(req, res){
    res.send('웹툰의 액션 페이지입니다.')
});


function islogin(req, res, next){
    if(req.user){
        next();
    }else{
        res.send('로그인해주세요');
    }
}

//router를 바깥으로 보내주기
module.exports = router;