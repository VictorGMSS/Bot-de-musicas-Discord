const Discord = require('discord.js');
const { filterFormats, getURLVideoID } = require('ytdl-core');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const configs = require('./config.json');
const google = require('googleapis');
const { composer } = require('googleapis/build/src/apis/composer');
const { link } = require('ffmpeg-static');

const youtube = new google.youtube_v3.Youtube({
    version: 'v3',
    auth: configs.GOOGLE_KEY
});

const prefix = configs.PREFIX;

const servidores = {
    'server' : {
        connection: null,
        dispatcher: null,
        fila: [],
        estado: false,
    }
}

client.on("ready", () => {
    console.log('Estou online!');
});

client.on("message", async (msg) => {
    // filtros 
    if(!msg.guild) return;

    if(!msg.content.startsWith(prefix)) return;

    //comandos
    if(msg.content == prefix + 'olá' || msg.content == prefix + 'ola'){
        msg.reply('olá, sou um bot criado pelo Verxs. Estou a sua disposição.');
    }

    if(msg.content == prefix + 'join'){ //join
        try{
            servidores.server.connection = await msg.member.voice.channel.join();
        }
        catch(err){
            console.log('Erro ao entrar em um canal de voz!');
            consolge.log(err);
        }      
    }

    if(msg.content == prefix + 'skip'){ //.skip
        servidores.server.fila.shift();
        servidores.server.estado = false;
        tocaMusicas();
    }


    if(msg.content == prefix + 'leave'){ //leave
        msg.member.voice.channel.leave();
        servidores.server.connection = null;
        servidores.server.dispatcher = null;
    }

    if(msg.content.startsWith(prefix + 'play')){ //.play <link>
        let musica = msg.content.slice(6);

        if(musica.length === 0 ){
            msg.channel.send('Hmm, acho que esqueceu da musica =/');
            return;
        }

        if(servidores.server.connection === null){
            try{
                servidores.server.connection = await msg.member.voice.channel.join();
            }
            catch(err){
                console.log('Erro ao entrar em um canal de voz!');
                consolge.log(err);
            }    
        }


        if(ytdl.validateURL(musica)){
            servidores.server.fila.push(musica);
            console.log('Adcionado: '+musica);
            tocaMusicas();
            }
            else{
            youtube.search.list({
                q: musica,
                part:'snippet',
                fields:'items(id(videoId),snippet(title))',
                type: 'video'
            },  function(err, resultado){
                    if(err){
                        console.log(err);
                    }
                    if(resultado){
                        const id = resultado.data.items[0].id.videoId;
                        musica = 'https://www.youtube.com/watch?v=' + id;
                        //servidores.server.dispatcher = servidores.server.connection.play(ytdl(musica, configs.YTDL));
                        if(ytdl.validateURL(musica)){
                        servidores.server.fila.push(musica);
                        //console.log('Adcionado '+musica);
                        tocaMusicas();
                        }
                    }
                });
        }
    }  
        
        if(msg.content.startsWith(prefix + 'playlist')){ //.playlist <link>
            let musica = msg.content.slice(10);

            musica = musica.split('&')[1];
            musica = musica.replace("list=", "");
    
            youtube.playlistItems.list({
                playlistId: musica,
                part: 'snippet',
                fields: 'items(snippet(resourceId(videoId)))',
                items: ['items(snippet(resourceId(videoId)))'],
                maxResults: 4,
            }, function(err, resultado){
                    //quantidade= resultado.data.
                    if(err){
                    console.log(err);
                    }
                    if(resultado){

                    //for(var i=0; i<=10; i++){

                        
                        try{
                        aux= resultado.data.items[0].snippet.resourceId.videoId;
                        musica='https://www.youtube.com/watch?v=' + aux;
                        servidores.server.fila.push(musica);
                        }
                        catch(err){
                            console.log('Erro');
                            consolge.log(err);
                        }   
                   // }

                    tocaMusicas();

                    }
                });
        }
    });


    const tocaMusicas = () => { 
    if(servidores.server.estado === false){
        const tocando = servidores.server.fila[0];
        servidores.server.estado = true;
        servidores.server.dispatcher = servidores.server.connection.play(ytdl(tocando, configs.YTDL));
        servidores.server.dispatcher.on('finish', () => {
            servidores.server.fila.shift();
            servidores.server.estado = false;
            if(servidores.server.fila.length > 0) {
                tocaMusicas();
            }
            else{
                servidores.server.dispatcher = null;
            }
        }); 
    }
}

client.login(configs.TOKEN_DISCORD);