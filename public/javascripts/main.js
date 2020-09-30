var $ = mdui.$;


$(function (){ 
    if (window.location.pathname=='/') {
        initItemPanel();      
        laydate.render({
            elem: '#datepicker', 
            theme: '#3F51B5',
            calendar: true,
            type: 'datetime',
            range: true,
        });
        showAnnouncement(false);
    }
});

function showAnnouncement(manual){
    $.ajax({
        method: 'GET',
        url: '/api/announcement',
        success: function (response) {
            var res = JSON.parse(response);
            var dialog = new mdui.Dialog('#announcement-dialog', {modal:true, closeOnEsc:false});

            if (manual) {
                initDialog($('#announcement-dialog'), '公告', res.content);
                dialog.open()
            } else if(res.autoShow){
                initDialog($('#announcement-dialog'), '公告', res.content);
                dialog.open()
            }
        }
    });
};

function checkRePWD() {
    var error = false;
    var pwd = $('#signup-pwd input').val();
    var repwd = $('#signup-repwd input').val();

    if (repwd=="") {
        error = true;
        $('#signup-repwd .mdui-textfield-error').text('重复密码不能为空');
    } else if(repwd != pwd){
        error = true;
        $('#signup-repwd .mdui-textfield-error').text('两次输入密码不同');
    } 
    if (error) {
        $('#signup-repwd').addClass('mdui-textfield-invalid');
    } else {
        $('#signup-repwd').removeClass('mdui-textfield-invalid');
    }
};

function login() {
    var user = $('#login-user input').val();
    var pwd = $('#login-pwd input').val();
    var isRemember = $('#login-check').is(':checked');

    $.ajax({
        method: 'POST',
        url: '/api/login',
        data: {
            id: user,
            pwd: pwd,
            isRemember: isRemember,
        },
        success: function (response) {
            var loginStatus = JSON.parse(response)
            if (!loginStatus.isAccountExist) {
                $('#login-pwd .mdui-textfield-error').text('用户不存在');
                $('#login-pwd').addClass('mdui-textfield-invalid');
            } else if(loginStatus.isLogin==true){
                window.location.href="/"
            }else{
                $('#login-pwd .mdui-textfield-error').text('密码错误');
                $('#login-pwd').addClass('mdui-textfield-invalid');
            }
        }
    });
};

function signup(){
    var user = $('#signup-user input').val();
    var name = $('#signup-name input').val();
    var pwd = $('#signup-pwd input').val();
    var repwd = $('#signup-repwd input').val();

    if((user!="")&&(name!="")&&(pwd!="")&&(repwd!="")&&(pwd==repwd)){
        $.ajax({
            method: 'POST',
            url: '/api/signup',
            data: {
                id: user,
                name: name,
                pwd: pwd, 
            },
            success: function (response) {
                var res = JSON.parse(response);
                var dialog = new mdui.Dialog('#login-card-dialog');
                if (!res.enableSignUp) {
                    initDialog($('#login-card-dialog'), '注册已关闭', '注册功能已关闭', ()=>{
                        $('#tab-signup').find('.mdui-textfield-input').val('');
                    });
                } else if (res.isNameExist) {
                    initDialog($('#login-card-dialog'), '账户已存在', '账户已存在', ()=>{
                        $('#tab-signup').find('.mdui-textfield-input').val('');
                    });
                } else {
                    initDialog($('#login-card-dialog'), '注册成功', '注册成功，请登录', ()=>{
                        $('#tab-signup').find('.mdui-textfield-input').val('');
                        new mdui.Tab('#tab-head').show(0);          
                    });
                }
                dialog.open(); 
            }
        });
    }
};

function initDialog(dialog, title, content, callback){
    dialog.find('.mdui-dialog-title').text(title);
    dialog.find('.mdui-dialog-content').text(content);
    if (callback!=undefined) {
        dialog.on('closed.mdui.dialog', function(){
            callback();
            dialog.off('closed.mdui.dialog');  
        });
    } 
};

function initItemPanel(){
    $.ajax({
        method: 'GET',
        url: '/api/itemList',
        success: function (response) {
            var res = JSON.parse(response);
            var panelBody = 
                '<div class="mdui-panel mdui-shadow-0 mdui-panel-gapless" mdui-panel>'+
                    '<div id="panel-head" class="mdui-panel-item">'+
                        '<div class="mdui-panel-item-header">'+
                        '<label class="mdui-radio"></label>'+
                        '<div class="mdui-panel-item-summary head-font">设备</div>'+
                        '<div class="mdui-panel-item-summary head-font">状态</div>'+
                        '<div class="mdui-panel-item-summary head-font">使用者</div>'+
                        '<div class="mdui-panel-item-summary head-font">材料</div>'+
                        '<div class="mdui-panel-item-summary head-font">温度</div>'+
                        '<div class="mdui-panel-item-summary head-font">预约开始时间</div>'+
                        '<div class="mdui-panel-item-summary head-font">预约结束时间</div>'+
                        '<i class="mdui-panel-item-arrow mdui-icon material-icons" style="visibility: hidden;">keyboard_arrow_down</i>'+
                        '</div>'+
                    '</div>';                 

            for (let obj of res) {
                let status, statusClass;

                if (obj.Expired=="无") {
                    status = "可预约";
                    statusClass = "status-idle";
                } else {
                    let expiredDate = new Date(obj.Expired);
                    //console.log(expiredDate)
                    if (expiredDate>new Date()) {
                        status = "已预约";
                        statusClass = "status-busy";
                    } else {
                        status = "可预约";
                        statusClass = "status-idle";
                    }
                }

                panelBody += 
                '<div id="panel-item-' + obj.ItemID + '" class="mdui-panel-item">'+
                    '<div class="mdui-panel-item-header">'+
                        '<label class="mdui-radio">'+
                            '<input id="selector-' + obj.ItemID + '" type="radio" name="panel-selector"/>'+
                            '<i class="mdui-radio-icon"></i>'+
                        '</label>'+
                        '<div class="mdui-panel-item-summary">' + obj.Item + '</div>'+
                        '<div class="mdui-panel-item-summary ' + statusClass + '">'+ status + '</div>'+
                        '<div class="mdui-panel-item-summary">' + obj.UserName + '</div>'+
                        '<div class="mdui-panel-item-summary">' + obj.Material + '</div>'+
                        '<div class="mdui-panel-item-summary">' + obj.Temperature + '</div>'+
                        '<div class="mdui-panel-item-summary">' + obj.Rented + '</div>'+
                        '<div class="mdui-panel-item-summary">' + obj.Expired + '</div>'+
                        '<i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>'+
                    '</div>'+
                    '<div class="mdui-panel-item-body">'+
                        '<div class="mdui-spinner mdui-center"></div>'+
                    '</div>'+
                '</div>';   

            }
            panelBody += '</div>';
            $('#main-card').prepend(panelBody);
            mdui.mutation();
            for (let obj of res) {
                $('#panel-item-' + obj.ItemID).on('opened.mdui.panel', function(){
                    initHistory(obj.ItemID);
                });  
            }
        }
    });
};

function initHistory(id){
    $.ajax({
        method: 'GET',
        url: '/api/history',
        data: {
            id: id,
        },
        success: function (response) {
            var history = JSON.parse(response).history;
            var str = 
                '<div class="mdui-table-fluid mdui-shadow-0 mdui-table-hoverable">'+
                    '<table class="mdui-table mdui-table-selectable">'+
                        '<thead><tr>'+
                            '<th>预约时间</th>'+
                            '<th>使用者</th>'+
                            '<th>材料</th>'+
                            '<th>温度</th>'+
                            '<th>开始时间</th>'+
                            '<th>结束时间</th>'+                        
                        '</tr></thead>'+
                        '<tbody>';
            for (let obj of history) {
                console.log(obj)
                str += 
                    '<tr>'+
                    '<td>' + obj.Time + '</td>'+
                    '<td>' + obj.UserName + '</td>'+
                    '<td>' + obj.Material + '</td>'+
                    '<td>' + obj.Temperature + '</td>'+
                    '<td>' + obj.Rented + '</td>'+
                    '<td>' + obj.Expired + '</td>'+               
                    '</tr>';
            }
            str += "</tbody></table></div>";
            $('#panel-item-' + id + ' .mdui-panel-item-body').empty();
            $('#panel-item-' + id + ' .mdui-panel-item-body').append(str);          
            mdui.mutation();
        }
    });
};

function submit(){
    var datetime = $('#datepicker').val();
    var temperature = $('#temperature-input').val();
    var material = $('#material-input').val();
    var itemID;
    for (let radio of document.getElementsByName("panel-selector")) {
        if (radio.checked) {
            itemID = Number(radio.getAttribute("id").split("-")[1]);
        }
    }

    if ((datetime && temperature && material && itemID)) {
        var begin  = datetime.split(" - ")[0];
        var end = datetime.split(" - ")[1];
        $.ajax({
            method: 'POST',
            url: '/api/submit',
            data: {
                ItemID: itemID,
                Material: material,
                Temperature: temperature,
                Rented: begin,
                Expired: end,
            },
            success: function (response) {
                if (JSON.parse(response).success) {
                    refreshPanel();
                    mdui.snackbar("预约成功！");
                } else {
                    mdui.snackbar("该设备已被预约！");
                }
                
            }
        });
    }
};

function refreshPanel(){
    $('#main-card .mdui-panel').remove();
    initItemPanel();
};