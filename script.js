function ajustarAlturaSprite(sprite, alturaAlvo) {
    let escala = alturaAlvo / sprite.height;
    sprite.setScale(escala);
}

function ajustarTamanhoBola(scene, sprite) {
    let imagemOriginal = scene.textures.get('bola').getSourceImage();
    let alturaOriginal = imagemOriginal.height * 0.09;
    ajustarAlturaSprite(sprite, alturaOriginal);
}

function lerStorage(chave, padrao) {
    try {
        let valor = localStorage.getItem(chave);
        return valor === null ? padrao : valor;
    } catch (e) {
        return padrao;
    }
}

function salvarStorage(chave, valor) {
    try {
        localStorage.setItem(chave, valor);
    } catch (e) {}
}

function lerJSONStorage(chave, padrao) {
    try {
        return JSON.parse(lerStorage(chave, JSON.stringify(padrao)));
    } catch (e) {
        return padrao;
    }
}

function tocarSom(scene, key, config = {}) {
    if (scene.cache.audio.exists(key)) {
        scene.sound.stopByKey(key);
        scene.sound.play(key, config);
    }
}

function pararSom(scene, key) {
    if (scene.cache.audio.exists(key)) {
        scene.sound.stopByKey(key);
    }
}

const ALTURA_PERSONAGEM_SELECAO = 200;
const ALTURA_PERSONAGEM_JOGO = 140;

class MenuStart extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuStart' });
    }

    preload() {
        this.load.image('fundo_inicio', 'imagens/fundoinicio.png');
        this.load.image('botao_inicio', 'imagens/botaoinicio.png');
        this.load.image('fundo_jogo', 'imagens/fundo.png');
        this.load.image('fundo_selecao', 'imagens/fundoselecao.png');

        this.load.image('char_arthur', 'imagens/imagemarthur.png');
        this.load.image('char_laura', 'imagens/imagemlaura.png');
        this.load.image('char_davi', 'imagens/Davi.png');
        this.load.image('char_estelar', 'imagens/Estelar.png');
        this.load.image('char_micael', 'imagens/Micael.png');
        this.load.image('char_joana', 'imagens/Joana.png');

        this.load.image('bola', 'imagens/imagembola.png');
        this.load.image('bola2', 'imagens/bola2.png');
        this.load.image('bola3', 'imagens/bola3.png');
        this.load.image('bolafinal', 'imagens/bolafinal.png');

        this.load.audio('lucasvoice', 'sons/lucasvoice.mp3');
        this.load.audio('menusong', 'sons/menusong.mp3');
        this.load.audio('final', 'sons/final.mp3');
        this.load.audio('jogoprincipal', 'sons/jogoprincipal.mp3');
        this.load.audio('victory', 'sons/victory.mp3');
    }

    create() {
        this.add.image(500, 300, 'fundo_inicio').setDisplaySize(1000, 600).setScrollFactor(0);

        let iniciarMusicaMenu = () => {
            let musicaMenu = this.sound.get('menusong');

            if (!musicaMenu || !musicaMenu.isPlaying) {
                tocarSom(this, 'menusong', { loop: true, volume: 0.5 });
            }
        };

        iniciarMusicaMenu();
        this.input.keyboard.once('keydown', iniciarMusicaMenu);

        let btnInicio = this.add.image(500, 400, 'botao_inicio').setInteractive({ useHandCursor: true });

        btnInicio.on('pointerover', () => btnInicio.setScale(1.05));
        btnInicio.on('pointerout', () => btnInicio.setScale(1));
        btnInicio.on('pointerdown', () => {
            iniciarMusicaMenu();
            this.scene.start('SelectScene');
        });
    }
}

class SelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SelectScene' });
    }

    create() {
        this.add.image(500, 300, 'fundo_selecao').setDisplaySize(1000, 600).setScrollFactor(0);
        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.45);

        this.add.text(500, 40, 'ESCOLHA SEU JOGADOR', {
            fontSize: '32px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.personagens = [
            { key: 'char_arthur', nome: 'Arthur' },
            { key: 'char_laura', nome: 'Laura' },
            { key: 'char_davi', nome: 'Davi' },
            { key: 'char_estelar', nome: 'Estelar' },
            { key: 'char_micael', nome: 'Micael' },
            { key: 'char_joana', nome: 'Joana' }
        ];

        this.campoAtivo = null;

        this.jogador1 = this.criarPainelJogador(260, 'JOGADOR 1', 0, '#1e90ff');
        this.jogador2 = this.criarPainelJogador(740, 'JOGADOR 2', 1, '#ff3030');

        this.cursorVisivel = true;

        this.timerCursor = this.time.addEvent({
            delay: 450,
            loop: true,
            callback: () => {
                this.cursorVisivel = !this.cursorVisivel;

                if (this.campoAtivo === 'p1') {
                    this.atualizarTextoNome(this.jogador1);
                } else if (this.campoAtivo === 'p2') {
                    this.atualizarTextoNome(this.jogador2);
                }
            }
        });

        this.estrelas = parseInt(lerStorage('estrelas', '0')) || 0;

        this.bolas = [
            { key: 'bola', nome: 'BOLA INICIAL', preco: 0 },
            { key: 'bola2', nome: 'BOLA 2', preco: 5 },
            { key: 'bola3', nome: 'BOLA 3', preco: 10 },
            { key: 'bolafinal', nome: 'BOLA FINAL', preco: 20 }
        ];

        this.bolasCompradas = lerJSONStorage('bolasCompradas', ['bola']);

        if (!Array.isArray(this.bolasCompradas)) {
            this.bolasCompradas = ['bola'];
        }

        if (!this.bolasCompradas.includes('bola')) {
            this.bolasCompradas.unshift('bola');
        }

        this.bolaSelecionada = lerStorage('bolaSelecionada', 'bola');

        if (!this.bolasCompradas.includes(this.bolaSelecionada)) {
            this.bolaSelecionada = 'bola';
        }

        this.indiceBola = this.bolas.findIndex(b => b.key === this.bolaSelecionada);

        if (this.indiceBola < 0) {
            this.indiceBola = 0;
        }

        this.criarLojaBolas();

        this.btnPronto = this.add.rectangle(500, 545, 260, 55, 0x00cc44)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(3, 0xffffff);

        this.add.text(500, 545, 'PRONTO ►', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.btnPronto.on('pointerover', () => this.btnPronto.setFillStyle(0x00ff55));
        this.btnPronto.on('pointerout', () => this.btnPronto.setFillStyle(0x00cc44));
        this.btnPronto.on('pointerdown', () => this.tentarComecar());

        this.input.keyboard.on('keydown', event => this.aoApertarTecla(event));
    }

    criarPainelJogador(painelX, rotulo, indiceInicial, corDestaque) {
        let idJogador = painelX < 500 ? 'p1' : 'p2';

        let jog = {
            id: idJogador,
            indice: indiceInicial,
            nome: '',
            corDestaque: corDestaque
        };

        this.add.text(painelX, 90, rotulo, {
            fontSize: '20px',
            fill: corDestaque,
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        jog.sprite = this.add.image(painelX, 235, this.personagens[indiceInicial].key);
        ajustarAlturaSprite(jog.sprite, ALTURA_PERSONAGEM_SELECAO);

        let setaEsq = this.add.text(painelX - 150, 235, '◄', {
            fontSize: '40px',
            fill: corDestaque,
            fontFamily: 'Determination'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        let setaDir = this.add.text(painelX + 150, 235, '►', {
            fontSize: '40px',
            fill: corDestaque,
            fontFamily: 'Determination'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        setaEsq.on('pointerdown', () => this.trocarPersonagem(jog, -1));
        setaDir.on('pointerdown', () => this.trocarPersonagem(jog, 1));

        this.add.text(painelX, 372, 'NOME DO JOGADOR:', {
            fontSize: '11px',
            fill: '#cccccc',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        jog.caixaNome = this.add.rectangle(painelX, 400, 240, 42, 0x000000, 0.6)
            .setStrokeStyle(2, corDestaque)
            .setInteractive({ useHandCursor: true });

        jog.txtNomeDigitado = this.add.text(painelX, 400, 'clique para digitar', {
            fontSize: '15px',
            fill: '#888888',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        jog.caixaNome.on('pointerdown', () => {
            this.campoAtivo = idJogador;
            this.cursorVisivel = true;

            jog.caixaNome.setStrokeStyle(3, 0xffffff);

            this.atualizarOutraCaixa(idJogador);
            this.atualizarTextoNome(jog);
        });

        return jog;
    }

    atualizarOutraCaixa(idAtivo) {
        [this.jogador1, this.jogador2].forEach(j => {
            if (j && j.id !== idAtivo) {
                j.caixaNome.setStrokeStyle(2, j.corDestaque);
            }
        });
    }

    trocarPersonagem(jog, direcao) {
        jog.indice = (jog.indice + direcao + this.personagens.length) % this.personagens.length;

        let p = this.personagens[jog.indice];

        jog.sprite.setTexture(p.key);
        ajustarAlturaSprite(jog.sprite, ALTURA_PERSONAGEM_SELECAO);
    }

    atualizarTextoNome(jog) {
        let ativo = this.campoAtivo === jog.id;
        let cursor = ativo && this.cursorVisivel ? '|' : '';

        if (jog.nome.length > 0) {
            jog.txtNomeDigitado.setText(jog.nome + cursor);
            jog.txtNomeDigitado.setStyle({ fill: '#ffffff' });
        } else {
            jog.txtNomeDigitado.setText(ativo ? cursor : 'clique para digitar');
            jog.txtNomeDigitado.setStyle({ fill: '#888888' });
        }
    }

    aoApertarTecla(event) {
        if (this.campoAtivo) {
            let jog = this.campoAtivo === 'p1' ? this.jogador1 : this.jogador2;

            if (event.code === 'Backspace') {
                jog.nome = jog.nome.slice(0, -1);
            } else if (event.code === 'Enter' || event.code === 'Escape') {
                this.campoAtivo = null;
            } else if (event.key.length === 1 && jog.nome.length < 12 && /[a-zA-Z0-9À-ÿ ]/.test(event.key)) {
                jog.nome += event.key;
            }

            this.atualizarTextoNome(jog);
            return;
        }

        if (event.code === 'KeyA') {
            this.trocarPersonagem(this.jogador1, -1);
        } else if (event.code === 'KeyD') {
            this.trocarPersonagem(this.jogador1, 1);
        } else if (event.code === 'ArrowLeft') {
            this.trocarPersonagem(this.jogador2, -1);
        } else if (event.code === 'ArrowRight') {
            this.trocarPersonagem(this.jogador2, 1);
        } else if (event.code === 'Space' || event.code === 'Enter') {
            this.tentarComecar();
        }
    }

    criarLojaBolas() {
        this.add.text(500, 95, 'BOLAS', {
            fontSize: '18px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        let texturaInicialLoja = this.textures.exists(this.bolas[this.indiceBola].key)
            ? this.bolas[this.indiceBola].key
            : 'bola';

        this.spriteBolaLoja = this.add.image(500, 170, texturaInicialLoja);
        ajustarAlturaSprite(this.spriteBolaLoja, 65);

        let setaEsq = this.add.text(440, 170, '◄', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Determination'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        let setaDir = this.add.text(560, 170, '►', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Determination'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        setaEsq.on('pointerdown', () => this.trocarBola(-1));
        setaDir.on('pointerdown', () => this.trocarBola(1));

        this.txtNomeBola = this.add.text(500, 220, '', {
            fontSize: '13px',
            fill: '#ffffff',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.txtPrecoBola = this.add.text(500, 243, '', {
            fontSize: '11px',
            fill: '#cccccc',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.txtEstrelasLoja = this.add.text(500, 275, '', {
            fontSize: '14px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.btnComprar = this.add.rectangle(500, 315, 165, 36, 0x444444)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xffffff);

        this.txtComprar = this.add.text(500, 315, '', {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.btnComprar.on('pointerdown', () => this.comprarOuSelecionarBola());

        this.atualizarLojaBolas();
    }

    trocarBola(direcao) {
        this.indiceBola = (this.indiceBola + direcao + this.bolas.length) % this.bolas.length;
        this.atualizarLojaBolas();
    }

    atualizarLojaBolas() {
        let bola = this.bolas[this.indiceBola];
        let comprada = this.bolasCompradas.includes(bola.key);
        let texturaLoja = this.textures.exists(bola.key) ? bola.key : 'bola';

        this.spriteBolaLoja.setTexture(texturaLoja);
        ajustarAlturaSprite(this.spriteBolaLoja, 65);

        this.txtNomeBola.setText(bola.nome);
        this.txtEstrelasLoja.setText(`★ ${this.estrelas} ESTRELAS`);

        if (!comprada) {
            this.txtPrecoBola.setText(`TRANCADA - ${bola.preco} ESTRELAS`);
            this.txtComprar.setText('COMPRAR');
            this.btnComprar.setFillStyle(0xaa6600);
        } else if (this.bolaSelecionada === bola.key) {
            this.txtPrecoBola.setText('LIBERADA');
            this.txtComprar.setText('SELECIONADA');
            this.btnComprar.setFillStyle(0x008844);
        } else {
            this.txtPrecoBola.setText('LIBERADA');
            this.txtComprar.setText('USAR');
            this.btnComprar.setFillStyle(0x0066aa);
        }
    }

    comprarOuSelecionarBola() {
        let bola = this.bolas[this.indiceBola];
        let comprada = this.bolasCompradas.includes(bola.key);

        if (!this.textures.exists(bola.key)) {
            this.txtComprar.setText('IMAGEM AUSENTE');
            this.time.delayedCall(1000, () => this.atualizarLojaBolas());
            return;
        }

        if (!comprada) {
            if (this.estrelas < bola.preco) {
                this.txtComprar.setText('SEM ESTRELAS');
                this.time.delayedCall(900, () => this.atualizarLojaBolas());
                return;
            }

            this.estrelas -= bola.preco;

            this.bolasCompradas.push(bola.key);

            salvarStorage('estrelas', this.estrelas);
            salvarStorage('bolasCompradas', JSON.stringify(this.bolasCompradas));
        }

        this.bolaSelecionada = bola.key;

        salvarStorage('bolaSelecionada', this.bolaSelecionada);

        this.atualizarLojaBolas();
    }

    tentarComecar() {
        this.campoAtivo = null;

        pararSom(this, 'menusong');

        let nomeP1 = this.jogador1.nome.trim() || 'Jogador 1';
        let nomeP2 = this.jogador2.nome.trim() || 'Jogador 2';

        this.scene.start('DialogoLucas', {
            jogador1: {
                textura: this.personagens[this.jogador1.indice].key,
                nome: nomeP1
            },

            jogador2: {
                textura: this.personagens[this.jogador2.indice].key,
                nome: nomeP2
            },

            bolaSelecionada: this.bolaSelecionada
        });
    }
}

class DialogoBase extends Phaser.Scene {
    preload() {
        this.load.image('fundo_dialogo', 'imagens/fundo.png');
        this.load.image('lucas_boca_fechada', 'imagens/lucas_boca_fechada.png');
        this.load.image('lucas_boca_aberta', 'imagens/lucas_boca_aberta.png');
    }

    criarInterfaceDialogo() {
        this.add.image(500, 300, 'fundo_dialogo').setDisplaySize(1000, 600).setScrollFactor(0);

        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.25);

        this.personagem = this.add.image(500, 300, 'lucas_boca_fechada').setScale(1.1);

        this.add.rectangle(500, 500, 940, 160, 0x000000, 0.8).setStrokeStyle(3, 0xffffff);

        this.txtNome = this.add.text(90, 440, '', {
            fontSize: '22px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        });

        this.txtDialogo = this.add.text(90, 475, '', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Determination',
            wordWrap: { width: 820 }
        });

        this.txtContinuar = this.add.text(920, 555, '▼ CLIQUE / ESPAÇO / ENTER / ►', {
            fontSize: '12px',
            fill: '#00ffff',
            fontFamily: 'Determination'
        }).setOrigin(1, 0.5).setAlpha(0);

        this.add.text(90, 555, '◄ VOLTAR', {
            fontSize: '12px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        }).setOrigin(0, 0.5);

        this.textoCompleto = '';
        this.textoAtual = '';
        this.indiceCaractere = 0;
        this.digitando = false;
        this.velocidadeDigitacao = 28;
        this.timerDigitacao = null;
        this.bocaAberta = false;
        this.timerBoca = null;
        this.indiceDialogo = 0;

        this.mostrarDialogoAtual();

        this.input.on('pointerdown', () => this.avancar());
        this.input.keyboard.on('keydown-SPACE', () => this.avancar());
        this.input.keyboard.on('keydown-ENTER', () => this.avancar());
        this.input.keyboard.on('keydown-RIGHT', () => this.avancar());
        this.input.keyboard.on('keydown-LEFT', () => this.voltar());
    }

    voltar() {
        if (this.indiceDialogo > 0) {
            this.indiceDialogo--;
            this.mostrarDialogoAtual();
        }
    }

    mostrarDialogoAtual() {
        let dialogo = this.dialogos[this.indiceDialogo];

        this.txtNome.setText(dialogo.nome);

        this.textoCompleto = dialogo.texto;
        this.textoAtual = '';
        this.indiceCaractere = 0;

        this.txtDialogo.setText('');
        this.txtContinuar.setAlpha(0);

        pararSom(this, 'lucasvoice');

        tocarSom(this, 'lucasvoice', { loop: true, volume: 0.7 });

        this.iniciarDigitacao();
    }

    iniciarDigitacao() {
        this.digitando = true;

        this.iniciarAnimacaoBoca();

        if (this.timerDigitacao) {
            this.timerDigitacao.remove();
        }

        this.timerDigitacao = this.time.addEvent({
            delay: this.velocidadeDigitacao,
            loop: true,

            callback: () => {
                if (this.indiceCaractere < this.textoCompleto.length) {
                    this.textoAtual += this.textoCompleto[this.indiceCaractere];
                    this.txtDialogo.setText(this.textoAtual);
                    this.indiceCaractere++;
                } else {
                    this.finalizarDigitacao();
                }
            }
        });
    }

    finalizarDigitacao() {
        if (this.timerDigitacao) {
            this.timerDigitacao.remove();
            this.timerDigitacao = null;
        }

        this.digitando = false;

        pararSom(this, 'lucasvoice');

        this.pararAnimacaoBoca();

        this.txtContinuar.setAlpha(1);
    }

    iniciarAnimacaoBoca() {
        if (this.timerBoca) {
            this.timerBoca.remove();
        }

        this.timerBoca = this.time.addEvent({
            delay: 260,
            loop: true,

            callback: () => {
                this.bocaAberta = !this.bocaAberta;

                this.personagem.setTexture(
                    this.bocaAberta ? 'lucas_boca_aberta' : 'lucas_boca_fechada'
                );
            }
        });
    }

    pararAnimacaoBoca() {
        if (this.timerBoca) {
            this.timerBoca.remove();
            this.timerBoca = null;
        }

        this.bocaAberta = false;

        this.personagem.setTexture('lucas_boca_fechada');
    }

    avancar() {
        if (this.digitando) {
            if (this.timerDigitacao) {
                this.timerDigitacao.remove();
                this.timerDigitacao = null;
            }

            this.textoAtual = this.textoCompleto;

            this.txtDialogo.setText(this.textoAtual);

            this.finalizarDigitacao();

            return;
        }

        this.indiceDialogo++;

        if (this.indiceDialogo < this.dialogos.length) {
            this.mostrarDialogoAtual();
        } else {
            this.aoFinalizarDialogo();
        }
    }

    aoFinalizarDialogo() {}
}

class DialogoLucas extends DialogoBase {
    constructor() {
        super({ key: 'DialogoLucas' });
    }

    init(data) {
        this.dadosJogadores = (data && data.jogador1)
            ? data
            : {
                jogador1: { textura: 'char_arthur', nome: 'Jogador 1' },
                jogador2: { textura: 'char_laura', nome: 'Jogador 2' },
                bolaSelecionada: 'bola'
            };
    }

    create() {
        let nome1 = this.dadosJogadores.jogador1.nome;
        let nome2 = this.dadosJogadores.jogador2.nome;

        this.dialogos = [
            {
                nome: 'Professor Lucas',
                texto: 'BEM VINDO, CAROS(AS) ESTUDANTES!'
            },
            {
                nome: 'Professor Lucas',
                texto: 'Abriu uma vaga nos JIFS, e preciso decidir quem ficará com a vaga.'
            },
            {
                nome: 'Professor Lucas',
                texto: `Para isso, ${nome1} e ${nome2} irão duelar em uma insana partida de vôlei!`
            },
            {
                nome: 'Professor Lucas',
                texto: 'Quem ganhar vai para os JIFS 2026!'
            },
            {
                nome: 'Professor Lucas',
                texto: 'As regras do jogo são simples.'
            },
            {
                nome: 'Professor Lucas',
                texto: 'O objetivo da partida é chegar a 15 pontos.'
            },
            {
                nome: 'Professor Lucas',
                texto: 'Cada lado tem direito a até 3 toques.'
            },
            {
                nome: 'Professor Lucas',
                texto: 'Você pode atacar no primeiro, segundo ou terceiro toque.'
            },
            {
                nome: 'Professor Lucas',
                texto: 'Para jogar, os controles são:'
            },
            {
                nome: 'Professor Lucas',
                texto: `${nome1} (Jogador 1): mova-se com [A] e [D], pule com [W] e mergulhe com [S]. Use [Q] para defender/levantar e [E] para sacar/atacar/bloquear!`
            },
            {
                nome: 'Professor Lucas',
                texto: `${nome2} (Jogador 2): mova-se com [◄] e [►], pule com [▲] e mergulhe com [▼]. Use [SHIFT] para defender/levantar e [ENTER] para sacar/atacar/bloquear!`
            },
            {
                nome: 'Professor Lucas',
                texto: 'Para bloquear, fique perto da rede e aperte o mesmo botão usado para atacar no momento em que a bola estiver chegando.'
            },
            {
                nome: 'Professor Lucas',
                texto: 'Um bom jogo e boa sorte para vocês!'
            }
        ];

        this.criarInterfaceDialogo();
    }

    aoFinalizarDialogo() {
        pararSom(this, 'lucasvoice');

        this.scene.start('GamePlay', this.dadosJogadores);
    }
}

class DialogoVitoria extends DialogoBase {
    constructor() {
        super({ key: 'DialogoVitoria' });
    }

    init(data) {
        this.dadosFinal = data || {};
    }

    create() {
        let vencedor = this.dadosFinal.nomeVencedor || 'Campeão';

        tocarSom(this, 'final', { loop: true, volume: 0.5 });

        this.dialogos = [
            {
                nome: 'Professor Lucas',
                texto: `Parabéns, ${vencedor}! Você foi convocado(a) para os JIFS!`
            },
            {
                nome: 'Professor Lucas',
                texto: 'Foi uma partida emocionante, e tenho certeza que você irá representar muito bem nosso campus!'
            }
        ];

        this.criarInterfaceDialogo();
    }

    aoFinalizarDialogo() {
        pararSom(this, 'final');
        pararSom(this, 'lucasvoice');

        this.scene.start('GameOver', this.dadosFinal);
    }
}

class GamePlay extends Phaser.Scene {
    constructor() {
        super({ key: 'GamePlay' });
    }

    init(data) {
        this.dadosJogadores = (data && data.jogador1)
            ? data
            : {
                jogador1: { textura: 'char_arthur', nome: 'Jogador 1' },
                jogador2: { textura: 'char_laura', nome: 'Jogador 2' },
                bolaSelecionada: 'bola'
            };
    }

    create() {
        this.add.image(500, 300, 'fundo_jogo').setDisplaySize(1000, 600).setScrollFactor(0);

        tocarSom(this, 'jogoprincipal', { loop: true, volume: 0.5 });

        this.nomeP1 = this.dadosJogadores.jogador1.nome;
        this.nomeP2 = this.dadosJogadores.jogador2.nome;

        this.estrelas = parseInt(lerStorage('estrelas', '0')) || 0;

        this.platforms = this.physics.add.staticGroup();

        let chaoGrounded = this.add.rectangle(500, 565, 1000, 70, 0x222546);

        this.add.rectangle(500, 530, 1000, 2, 0xffffff);

        this.physics.add.existing(chaoGrounded, true);
        this.platforms.add(chaoGrounded);

        let rede = this.add.rectangle(500, 455, 8, 150, 0xe2e2e2);

        this.add.rectangle(500, 385, 14, 10, 0xff0000);

        this.physics.add.existing(rede, true);

        this.rede = rede;

        let barreiraCentral = this.add.rectangle(500, 300, 12, 600, 0x000000, 0);

        this.physics.add.existing(barreiraCentral, true);

        this.placarP1 = 0;
        this.placarP2 = 0;

        this.ladoAtualBola = 1;
        this.numToquesLado = 0;
        this.ladoUltimoToque = 0;

        this.qualidadeLevantamento = null;

        this.timerEfeito = 0;
        this.textoEfeitoStr = "";
        this.corEfeitoStr = "#fff";

        this.minigame = {
            ativo: false,
            posicaoLinha: 0,
            direcao: 1,
            velocidade: 3.2,
            larguraBarra: 200,
            alturaBarra: 20,
            x: 400,
            y: 100,
            jogadorAlvo: null,
            tempoRestante: 300
        };

        this.minigameLev = {
            ativo: false,
            posicaoLinha: 0,
            direcao: 1,
            velocidade: 4.5,
            larguraBarra: 140,
            alturaBarra: 12,
            jogadorAlvo: null
        };

        this.efeitoImpacto = {
            ativo: false,
            x: 0,
            y: 0,
            raio: 0,
            cor: "#ff0000"
        };

        this.saqueEmAndamento = false;
        this.ladoSacador = 1;
        this.saqueCruzouRede = false;
        this.cooldownRede = 0;

        this.bloqueio = {
            distMaxJogadorRede: 105,
            distMaxBolaRede: 125,
            alturaMinima: 245,
            alturaMaxima: 455,
            cooldownP1: 0,
            cooldownP2: 0
        };

        this.chaoTopoY = 530;

        this.p1 = this.physics.add.sprite(120, 450, this.dadosJogadores.jogador1.textura);

        ajustarAlturaSprite(this.p1, ALTURA_PERSONAGEM_JOGO);

        this.p1.setCollideWorldBounds(true);
        this.p1.statusPeixinho = "normal";
        this.p1.timerPeixinho = 0;
        this.p1.direcaoPeixinho = 1;
        this.p1.setY(this.chaoTopoY - this.p1.displayHeight / 2);

        this.p2 = this.physics.add.sprite(880, 450, this.dadosJogadores.jogador2.textura);

        ajustarAlturaSprite(this.p2, ALTURA_PERSONAGEM_JOGO);

        this.p2.setCollideWorldBounds(true);
        this.p2.statusPeixinho = "normal";
        this.p2.timerPeixinho = 0;
        this.p2.direcaoPeixinho = -1;
        this.p2.setY(this.chaoTopoY - this.p2.displayHeight / 2);

        let texturaBola = this.dadosJogadores.bolaSelecionada || lerStorage('bolaSelecionada', 'bola');

        if (!this.textures.exists(texturaBola)) {
            texturaBola = 'bola';
        }

        this.bola = this.physics.add.sprite(135, 350, texturaBola);

        ajustarTamanhoBola(this, this.bola);

        this.bola.setCollideWorldBounds(true);
        this.bola.setBounce(0.85);

        this.bola.ataqueCritico = false;
        this.bola.emAtaque = false;
        this.bola.emEsperaDeSaque = true;

        this.physics.add.collider(this.p1, chaoGrounded);
        this.physics.add.collider(this.p2, chaoGrounded);
        this.physics.add.collider(this.p1, rede);
        this.physics.add.collider(this.p2, rede);
        this.physics.add.collider(this.p1, barreiraCentral);
        this.physics.add.collider(this.p2, barreiraCentral);
        this.physics.add.collider(this.bola, this.platforms);

        this.estrelasCaindo = [];

        this.timerCriarEstrela = this.time.addEvent({
            delay: 4000,
            loop: true,
            callback: () => this.criarEstrela()
        });

        this.txtPlacarP1 = this.add.text(200, 45, '00', {
            fontSize: '35px',
            fill: '#1e90ff',
            fontFamily: 'Determination'
        });

        this.txtPlacarP2 = this.add.text(770, 45, '00', {
            fontSize: '35px',
            fill: '#ff3030',
            fontFamily: 'Determination'
        });

        this.txtNomeP1 = this.add.text(200, 20, this.nomeP1.toUpperCase(), {
            fontSize: '13px',
            fill: '#1e90ff',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.txtNomeP2 = this.add.text(770, 20, this.nomeP2.toUpperCase(), {
            fontSize: '13px',
            fill: '#ff3030',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.txtEstrelas = this.add.text(500, 28, `★ ${this.estrelas}`, {
            fontSize: '16px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        this.txtToques = this.add.text(170, 90, '', {
            fontSize: '16px',
            fill: '#1e90ff',
            fontFamily: 'Determination'
        });

        this.txtEfeito = this.add.text(260, 170, '', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Determination'
        });

        this.uiGraphics = this.add.graphics();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.keysP1 = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            atacar: Phaser.Input.Keyboard.KeyCodes.E,
            defender: Phaser.Input.Keyboard.KeyCodes.Q
        });

        this.keysP2 = this.input.keyboard.addKeys({
            atacar: Phaser.Input.Keyboard.KeyCodes.ENTER,
            defender: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        this.input.keyboard.on('keydown-E', () => {
            if (this.minigame.ativo && this.minigame.jogadorAlvo === this.p1) {
                this.processarSaque();
            } else if (!this.tentarBloqueio(this.p1)) {
                this.processarToqueAtaque(this.p1);
            }
        });

        this.input.keyboard.on('keydown-Q', () => this.processarToqueDefesaLevantamento(this.p1));
        this.input.keyboard.on('keydown-S', () => this.tentarPeixinho(this.p1));

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.minigame.ativo && this.minigame.jogadorAlvo === this.p2) {
                this.processarSaque();
            } else if (!this.tentarBloqueio(this.p2)) {
                this.processarToqueAtaque(this.p2);
            }
        });

        this.input.keyboard.on('keydown-SHIFT', () => this.processarToqueDefesaLevantamento(this.p2));
        this.input.keyboard.on('keydown-DOWN', () => this.tentarPeixinho(this.p2));

        this.resetBola(1);
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.keysP2.esc)) {
            pararSom(this, 'jogoprincipal');
            this.scene.start('MenuStart');
            return;
        }

        if (this.bloqueio.cooldownP1 > 0) {
            this.bloqueio.cooldownP1--;
        }

        if (this.bloqueio.cooldownP2 > 0) {
            this.bloqueio.cooldownP2--;
        }

        if (this.cooldownRede > 0) {
            this.cooldownRede--;
        }

        this.atualizarMovimentoJogador(this.p1, this.keysP1);
        this.atualizarMovimentoJogador(this.p2, this.cursors);

        this.atualizarBola();
        this.atualizarMinigames();
        this.atualizarEstrelas(delta);
        this.desenharHUDGraphic();
    }

    criarEstrela() {
        if (this.bola.emEsperaDeSaque) {
            return;
        }

        let estrela = this.add.text(Phaser.Math.Between(70, 930), -20, '★', {
            fontSize: '30px',
            fill: '#ffea00',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        estrela.velocidadeQueda = Phaser.Math.Between(100, 160);

        this.estrelasCaindo.push(estrela);
    }

    atualizarEstrelas(delta) {
        if (!this.estrelasCaindo) {
            return;
        }

        for (let i = this.estrelasCaindo.length - 1; i >= 0; i--) {
            let estrela = this.estrelasCaindo[i];

            if (!estrela || !estrela.active) {
                this.estrelasCaindo.splice(i, 1);
                continue;
            }

            estrela.y += estrela.velocidadeQueda * (delta / 1000);

            let pegouP1 = Phaser.Math.Distance.Between(
                estrela.x,
                estrela.y,
                this.p1.x,
                this.p1.y - 20
            ) < 65;

            let pegouP2 = Phaser.Math.Distance.Between(
                estrela.x,
                estrela.y,
                this.p2.x,
                this.p2.y - 20
            ) < 65;

            if (pegouP1 || pegouP2) {
                this.coletarEstrela(estrela);
                this.estrelasCaindo.splice(i, 1);
            } else if (estrela.y > 570) {
                estrela.destroy();
                this.estrelasCaindo.splice(i, 1);
            }
        }
    }

    coletarEstrela(estrela) {
        if (!estrela || !estrela.active) {
            return;
        }

        estrela.destroy();

        this.estrelas++;

        salvarStorage('estrelas', this.estrelas);

        this.txtEstrelas.setText(`★ ${this.estrelas}`);

        this.efeitoAcerto('+1 ESTRELA!', '#ffea00');
    }

    resetBola(jogadorQueSaca) {
        this.bola.ataqueCritico = false;
        this.bola.emAtaque = false;

        this.saqueEmAndamento = false;
        this.saqueCruzouRede = false;

        this.ladoSacador = jogadorQueSaca;

        this.minigame.ativo = false;
        this.minigameLev.ativo = false;

        this.qualidadeLevantamento = null;

        if (jogadorQueSaca === 1) {
            this.p1.setPosition(120, this.chaoTopoY - this.p1.displayHeight / 2);
            this.p1.setVelocity(0, 0);

            this.bola.setPosition(135, 350);
            this.bola.setVelocity(0, 0);

            this.minigame.jogadorAlvo = this.p1;

            this.ladoAtualBola = 1;
        } else {
            this.p2.setPosition(880, this.chaoTopoY - this.p2.displayHeight / 2);
            this.p2.setVelocity(0, 0);

            this.bola.setPosition(865, 350);
            this.bola.setVelocity(0, 0);

            this.minigame.jogadorAlvo = this.p2;

            this.ladoAtualBola = 2;
        }

        this.numToquesLado = 0;
        this.ladoUltimoToque = 0;

        this.bola.emEsperaDeSaque = true;
        this.bola.body.allowGravity = false;

        this.minigame.ativo = true;
        this.minigame.posicaoLinha = 0;
        this.minigame.direcao = 1;
        this.minigame.velocidade = 3.2;
        this.minigame.tempoRestante = 300;
    }

    atualizarMovimentoJogador(jog, controles) {
        let estaSacando = this.bola.emEsperaDeSaque && this.minigame.jogadorAlvo === jog;

        if (estaSacando) {
            jog.setVelocity(0, 0);
            jog.statusPeixinho = "normal";
        } else if (jog.statusPeixinho === "deslizando") {
            jog.setVelocityX(jog.direcaoPeixinho * 400);
            jog.timerPeixinho--;

            if (jog.timerPeixinho <= 0) {
                jog.statusPeixinho = "levantando";
                jog.timerPeixinho = 15;
            }
        } else if (jog.statusPeixinho === "levantando") {
            jog.setVelocityX(0);
            jog.timerPeixinho--;

            if (jog.timerPeixinho <= 0) {
                jog.statusPeixinho = "normal";
            }
        } else {
            let leftPressed = controles.left.isDown;
            let rightPressed = controles.right.isDown;
            let upPressed = controles.up.isDown;

            if (leftPressed) {
                jog.setVelocityX(-290);
            } else if (rightPressed) {
                jog.setVelocityX(290);
            } else {
                jog.setVelocityX(0);
            }

            if (upPressed && jog.body.touching.down) {
                jog.setVelocityY(-460);
            }

            if (jog.body.velocity.y > 0) {
                jog.body.setGravityY(900);
            } else {
                jog.body.setGravityY(0);
            }
        }
    }

    tentarPeixinho(jog) {
        if (this.bola.emEsperaDeSaque) {
            return;
        }

        let ladoJogador = jog === this.p1 ? 1 : 2;

        if (this.saqueEmAndamento && ladoJogador === this.ladoSacador) {
            this.efeitoAcerto("O SAQUE PRECISA CRUZAR A REDE!", "#ff5555");
            return;
        }

        if (jog.body.touching.down && jog.statusPeixinho === "normal") {
            jog.statusPeixinho = "deslizando";
            jog.timerPeixinho = 22;
            jog.direcaoPeixinho = jog === this.p1 ? 1 : -1;
            jog.setVelocityY(-120);
        }
    }

    limitarSubida(velYDesejada, yAtual, margemTopo = 60) {
        if (velYDesejada >= 0) {
            return velYDesejada;
        }

        let velMaxima = -Math.sqrt(2 * 750 * Math.max(yAtual - margemTopo, 10));

        return Math.max(velYDesejada, velMaxima);
    }

    tentarBloqueio(jog) {
        if (this.bola.emEsperaDeSaque || !this.bola.emAtaque) {
            return false;
        }

        let ladoJogador = jog === this.p1 ? 1 : 2;
        let cooldownAtual = jog === this.p1 ? this.bloqueio.cooldownP1 : this.bloqueio.cooldownP2;

        if (cooldownAtual > 0) {
            return false;
        }

        let distJogadorRede = Math.abs(jog.x - 500);
        let distBolaRede = Math.abs(this.bola.x - 500);

        let alturaOk =
            this.bola.y > this.bloqueio.alturaMinima &&
            this.bola.y < this.bloqueio.alturaMaxima;

        let vindoPraCa =
            ladoJogador === 1
                ? this.bola.body.velocity.x < 0
                : this.bola.body.velocity.x > 0;

        if (
            distJogadorRede > this.bloqueio.distMaxJogadorRede ||
            distBolaRede > this.bloqueio.distMaxBolaRede ||
            !alturaOk ||
            !vindoPraCa
        ) {
            return false;
        }

        if (jog.body.touching.down) {
            jog.setVelocityY(-310);
        }

        if (jog === this.p1) {
            this.bloqueio.cooldownP1 = 28;
        } else {
            this.bloqueio.cooldownP2 = 28;
        }

        if (distBolaRede > 78) {
            this.efeitoAcerto("BLOQUEIO FRACO!", "#ff5555");
            return true;
        }

        if (distBolaRede > 34) {
            let dirParaSeuLado = ladoJogador === 1 ? -1 : 1;

            this.bola.setVelocity(
                dirParaSeuLado * 250,
                this.limitarSubida(-300, this.bola.y)
            );

            this.bola.emAtaque = false;
            this.bola.ataqueCritico = false;

            this.cooldownRede = 10;
            this.ladoUltimoToque = ladoJogador;
            this.numToquesLado = 0;

            this.efeitoAcerto("BLOQUEIO MÉDIO! BOLA VIVA!", "#ffea00");

            return true;
        }

        let dirDevolucao = ladoJogador === 1 ? 1 : -1;
        let raioBola = Math.max(this.bola.displayWidth, this.bola.displayHeight) / 2;

        this.bola.x = 500 + dirDevolucao * (raioBola + 12);

        this.bola.setVelocity(
            dirDevolucao * 340,
            this.limitarSubida(-270, this.bola.y)
        );

        this.bola.emAtaque = false;
        this.bola.ataqueCritico = false;

        this.cooldownRede = 12;
        this.ladoUltimoToque = ladoJogador;
        this.numToquesLado = 0;

        this.efeitoImpacto = {
            ativo: true,
            x: this.bola.x,
            y: this.bola.y,
            raio: 10,
            cor: "#00ff00"
        };

        this.efeitoAcerto("BLOQUEIO FORTE!", "#00ff00");

        return true;
    }

    tratarColisaoRede() {
        if (this.cooldownRede > 0) {
            return;
        }

        const redeX = 500;
        const topoRede = 380;

        let raioBola = Math.max(this.bola.displayWidth, this.bola.displayHeight) / 2;
        let faixaX = raioBola + 7;

        let encostouNaRede =
            Math.abs(this.bola.x - redeX) <= faixaX &&
            this.bola.y > topoRede - 3;

        if (!encostouNaRede) {
            return;
        }

        let vx = this.bola.body.velocity.x;
        let vy = this.bola.body.velocity.y;

        let veioDaEsquerda = vx > 0 ? true : (vx < 0 ? false : this.bola.x < redeX);
        let dirRetorno = veioDaEsquerda ? -1 : 1;

        this.bola.x = redeX + dirRetorno * (faixaX + 8);

        this.bola.setVelocity(
            dirRetorno * Math.max(190, Math.abs(vx) * 0.55),
            this.limitarSubida(
                -Math.max(
                    120,
                    Math.min(230, Math.abs(vy) * 0.35 + 70)
                ),
                this.bola.y
            )
        );

        this.bola.emAtaque = false;
        this.bola.ataqueCritico = false;

        this.cooldownRede = 12;

        this.efeitoAcerto("TOCOU NA REDE!", "#ffaa00");
    }

    atualizarBola() {
        if (this.bola.emEsperaDeSaque) {
            return;
        }

        this.tratarColisaoRede();

        let novoLado = this.bola.x < 500 ? 1 : 2;

        if (this.saqueEmAndamento && novoLado !== this.ladoSacador) {
            this.saqueEmAndamento = false;
            this.saqueCruzouRede = true;
        }

        if (novoLado !== this.ladoAtualBola) {
            this.ladoAtualBola = novoLado;
            this.minigameLev.ativo = false;
            this.qualidadeLevantamento = null;
        }

        if (this.bola.body.touching.down || this.bola.y >= 505) {
            this.bola.emEsperaDeSaque = true;
            this.saqueEmAndamento = false;
            this.bola.emAtaque = false;

            this.minigame.ativo = false;
            this.minigameLev.ativo = false;

            this.bola.setVelocity(0, 0);

            let pontoParaP2 = this.bola.x < 500;

            if (pontoParaP2) {
                this.placarP2++;
            } else {
                this.placarP1++;
            }

            this.finalizarPonto(pontoParaP2);

            return;
        }

        [this.p1, this.p2].forEach(jog => {
            if (jog.statusPeixinho === "deslizando" || jog.statusPeixinho === "levantando") {
                let dist = Phaser.Math.Distance.Between(
                    this.bola.x,
                    this.bola.y,
                    jog.x,
                    jog.y - 20
                );

                if (dist < 105) {
                    let ladoJogador = jog === this.p1 ? 1 : 2;

                    if (this.saqueEmAndamento && ladoJogador === this.ladoSacador) {
                        return;
                    }

                    if (ladoJogador === this.ladoAtualBola) {
                        this.bola.ataqueCritico = false;
                        this.bola.emAtaque = false;

                        let alvoDefesa = jog === this.p1 ? 270 : 730;

                        let velX = Phaser.Math.Clamp(
                            (alvoDefesa - this.bola.x) * 0.72,
                            -150,
                            150
                        );

                        this.bola.setVelocity(
                            velX,
                            this.limitarSubida(
                                Phaser.Math.Between(-570, -510),
                                this.bola.y
                            )
                        );

                        this.registrarNovoLadoDeToque(ladoJogador);

                        if (this.numToquesLado >= 3) {
                            this.darFaltaQuatroToques(ladoJogador);
                            return;
                        }

                        this.numToquesLado++;

                        this.minigameLev.ativo = true;
                        this.minigameLev.posicaoLinha = 0;
                        this.minigameLev.direcao = 1;
                        this.minigameLev.jogadorAlvo = jog;

                        this.efeitoAcerto("1º TOQUE: SALVOU NO PEIXINHO!", "#ff00ff");
                    }
                }
            }
        });
    }

    registrarNovoLadoDeToque(ladoJogador) {
        if (this.ladoUltimoToque !== ladoJogador) {
            this.numToquesLado = 0;
            this.ladoUltimoToque = ladoJogador;
            this.minigameLev.ativo = false;
            this.qualidadeLevantamento = null;
        }
    }

    processarToqueDefesaLevantamento(jog) {
        if (this.bola.emEsperaDeSaque) {
            return;
        }

        let ladoJogador = jog === this.p1 ? 1 : 2;

        if (ladoJogador !== this.ladoAtualBola) {
            return;
        }

        if (this.saqueEmAndamento && ladoJogador === this.ladoSacador) {
            this.efeitoAcerto("O SAQUE PRECISA CRUZAR A REDE!", "#ff5555");
            return;
        }

        let dist = Phaser.Math.Distance.Between(
            this.bola.x,
            this.bola.y,
            jog.x,
            jog.y - 45
        );

        if (dist > 170) {
            this.efeitoAcerto("MUITO LONGE!", "#ff5555");
            return;
        }

        this.registrarNovoLadoDeToque(ladoJogador);

        let pertoDaRede = Math.abs(this.bola.x - 500) < 130;

        if (this.numToquesLado === 0) {
            this.bola.ataqueCritico = false;
            this.bola.emAtaque = false;

            let alvoMeio = jog === this.p1 ? 270 : 730;

            let velX = Phaser.Math.Clamp(
                (alvoMeio - this.bola.x) * 0.75,
                -135,
                135
            );

            let velY = this.limitarSubida(
                pertoDaRede ? -570 : -525,
                this.bola.y
            );

            this.bola.setVelocity(velX, velY);

            this.numToquesLado = 1;

            this.minigameLev.ativo = true;
            this.minigameLev.posicaoLinha = 0;
            this.minigameLev.direcao = 1;
            this.minigameLev.jogadorAlvo = jog;

            this.efeitoAcerto("1º TOQUE: DEFESA!", "#00ffff");
        } else if (this.numToquesLado === 1) {
            this.bola.ataqueCritico = false;
            this.bola.emAtaque = false;

            let alvoLevantamento =
                jog === this.p1
                    ? Phaser.Math.Between(300, 365)
                    : Phaser.Math.Between(635, 700);

            let velXBase = Phaser.Math.Clamp(
                (alvoLevantamento - this.bola.x) * 0.80,
                -145,
                145
            );

            if (this.minigameLev.ativo) {
                let erro = Math.abs(
                    this.minigameLev.posicaoLinha -
                    (this.minigameLev.larguraBarra / 2)
                );

                this.minigameLev.ativo = false;

                if (erro < 15) {
                    this.bola.setVelocity(
                        velXBase,
                        this.limitarSubida(-620, this.bola.y)
                    );

                    this.qualidadeLevantamento = 'perfeito';

                    this.efeitoAcerto("LEVANTAMENTO PERFEITO!", "#00ff00");
                } else if (erro < 38) {
                    this.bola.setVelocity(
                        velXBase * 0.8,
                        this.limitarSubida(-560, this.bola.y)
                    );

                    this.qualidadeLevantamento = 'bom';

                    this.efeitoAcerto("LEVANTAMENTO BOM!", "#ffea00");
                } else {
                    let direcaoErrada =
                        velXBase *
                        (1.3 + Math.random() * 1.4) *
                        (Math.random() < 0.35 ? -1 : 1);

                    this.bola.setVelocity(
                        direcaoErrada,
                        this.limitarSubida(-340, this.bola.y)
                    );

                    this.qualidadeLevantamento = 'ruim';

                    this.efeitoAcerto("LEVANTAMENTO RUIM!", "#ff0000");
                }
            } else {
                this.bola.setVelocity(
                    velXBase,
                    this.limitarSubida(-650, this.bola.y)
                );

                this.qualidadeLevantamento = 'bom';

                this.efeitoAcerto("2º TOQUE: LEVANTAMENTO!", "#ffea00");
            }

            this.numToquesLado = 2;
        } else if (this.numToquesLado === 2) {
            let bolaBaixa = this.bola.y > 400;

            if (bolaBaixa) {
                let alvoMeio = jog === this.p1 ? 700 : 300;

                let velX = Phaser.Math.Clamp(
                    (alvoMeio - this.bola.x) * 1.0,
                    -330,
                    330
                );

                this.bola.ataqueCritico = false;
                this.bola.emAtaque = false;

                this.bola.setVelocity(
                    velX,
                    this.limitarSubida(-320, this.bola.y)
                );

                this.numToquesLado = 3;

                this.efeitoAcerto("3º TOQUE: MANCHETE DE EMERGÊNCIA!", "#00ffff");
            } else {
                this.efeitoAcerto("BOLA ALTA DEMAIS, ATAQUE COM [E/ENTER]!", "#ffea00");
            }
        } else {
            this.darFaltaQuatroToques(ladoJogador);
        }
    }

    processarToqueAtaque(jog) {
        if (this.bola.emEsperaDeSaque) {
            return;
        }

        let ladoJogador = jog === this.p1 ? 1 : 2;

        if (ladoJogador !== this.ladoAtualBola) {
            return;
        }

        if (this.saqueEmAndamento && ladoJogador === this.ladoSacador) {
            this.efeitoAcerto("O SAQUE PRECISA CRUZAR A REDE!", "#ff5555");
            return;
        }

        let dist = Phaser.Math.Distance.Between(
            this.bola.x,
            this.bola.y,
            jog.x,
            jog.y - 45
        );

        if (dist > 180) {
            this.efeitoAcerto("FORA DE ALCANCE DO ATAQUE!", "#ff5555");
            return;
        }

        this.registrarNovoLadoDeToque(ladoJogador);

        if (this.numToquesLado >= 3) {
            this.darFaltaQuatroToques(ladoJogador);
            return;
        }

        let numeroToque = this.numToquesLado + 1;

        this.executarAtaque(jog, numeroToque);
    }

    executarAtaque(jog, numeroToque) {
        let ladoJogador = jog === this.p1 ? 1 : 2;
        let distanciaRede = Math.abs(jog.x - 500);

        let alvoX;
        let nomeAtaque;
        let corEfeito;

        if (distanciaRede < 140) {
            alvoX =
                ladoJogador === 1
                    ? Phaser.Math.Between(670, 800)
                    : Phaser.Math.Between(200, 330);

            nomeAtaque = "ATAQUE RÁPIDO!";
            corEfeito = "#00ff00";
        } else if (distanciaRede < 310) {
            alvoX =
                ladoJogador === 1
                    ? Phaser.Math.Between(700, 840)
                    : Phaser.Math.Between(160, 300);

            nomeAtaque = "ATAQUE NO MEIO!";
            corEfeito = "#ffea00";
        } else {
            alvoX =
                ladoJogador === 1
                    ? Phaser.Math.Between(750, 900)
                    : Phaser.Math.Between(100, 250);

            nomeAtaque = "ATAQUE LONGO!";
            corEfeito = "#00ffff";
        }

        let qualidade = this.qualidadeLevantamento || 'direto';

        if (qualidade === 'ruim') {
            alvoX += Phaser.Math.Between(-55, 55);
        } else if (qualidade === 'direto') {
            alvoX += Phaser.Math.Between(-25, 25);
        }

        alvoX = Phaser.Math.Clamp(alvoX, 60, 940);

        let distanciaAlvo = Math.abs(alvoX - this.bola.x);

        let tempo = Phaser.Math.Clamp(
            distanciaAlvo / 720,
            0.40,
            0.80
        );

        let fatorTempo = {
            perfeito: 0.84,
            bom: 0.91,
            ruim: 1.06,
            direto: 0.97
        }[qualidade];

        tempo *= fatorTempo;

        let velX = (alvoX - this.bola.x) / tempo;
        let alvoY = Phaser.Math.Between(490, 510);

        let velY =
            (
                alvoY -
                this.bola.y -
                0.5 *
                750 *
                tempo *
                tempo
            )
            /
            tempo;

        velY = this.limitarSubida(velY, this.bola.y);

        if (numeroToque === 1) {
            nomeAtaque = "ATAQUE DE PRIMEIRA! " + nomeAtaque;
        } else if (numeroToque === 2) {
            nomeAtaque = "ATAQUE DE SEGUNDA! " + nomeAtaque;
        } else {
            nomeAtaque = "ATAQUE DE TERCEIRA! " + nomeAtaque;
        }

        this.bola.emAtaque = true;
        this.bola.ataqueCritico = qualidade === 'perfeito';

        this.bola.setVelocity(velX, velY);

        this.numToquesLado = numeroToque;

        this.qualidadeLevantamento = null;

        this.efeitoImpacto = {
            ativo: true,
            x: this.bola.x,
            y: this.bola.y,
            raio: 10,
            cor: corEfeito
        };

        this.efeitoAcerto(nomeAtaque, corEfeito);
    }

    darFaltaQuatroToques(ladoJogador) {
        this.efeitoAcerto("FALTA! 4 TOQUES!", "#ff0000");

        this.bola.emEsperaDeSaque = true;
        this.bola.emAtaque = false;

        this.saqueEmAndamento = false;
        this.minigameLev.ativo = false;

        let pontoParaP2 = ladoJogador === 1;

        if (pontoParaP2) {
            this.placarP2++;
        } else {
            this.placarP1++;
        }

        this.finalizarPonto(pontoParaP2);
    }

    processarSaque(forcarErro = false) {
        if (!this.minigame.ativo && !forcarErro) {
            return;
        }

        this.minigame.ativo = false;

        let erro = forcarErro
            ? 999
            : Math.abs(
                this.minigame.posicaoLinha -
                (this.minigame.larguraBarra / 2)
            );

        let quemSacou = this.minigame.jogadorAlvo;
        let dir = quemSacou === this.p1 ? 1 : -1;

        this.bola.body.allowGravity = true;
        this.bola.emAtaque = false;

        if (erro < 25) {
            this.bola.emEsperaDeSaque = false;
            this.bola.ataqueCritico = true;

            this.saqueEmAndamento = true;
            this.saqueCruzouRede = false;

            this.ladoSacador = quemSacou === this.p1 ? 1 : 2;

            this.bola.setVelocity(
                dir * 610,
                this.limitarSubida(-390, this.bola.y)
            );

            this.efeitoAcerto("SAQUE POTENTE!", "#00ff00");
        } else if (erro < 65) {
            this.bola.emEsperaDeSaque = false;
            this.bola.ataqueCritico = false;

            this.saqueEmAndamento = true;
            this.saqueCruzouRede = false;

            this.ladoSacador = quemSacou === this.p1 ? 1 : 2;

            this.bola.setVelocity(
                dir * 500,
                this.limitarSubida(-500, this.bola.y)
            );

            this.efeitoAcerto("SAQUE BOM!", "#ffea00");
        } else {
            this.bola.emEsperaDeSaque = true;
            this.saqueEmAndamento = false;
            this.saqueCruzouRede = false;

            this.efeitoAcerto("ERROU O SAQUE!", "#ff0000");

            let pontoParaP2 = quemSacou === this.p1;

            if (pontoParaP2) {
                this.placarP2++;
            } else {
                this.placarP1++;
            }

            this.finalizarPonto(pontoParaP2);
        }
    }

    finalizarPonto(pontoParaP2) {
        this.txtPlacarP1.setText(this.placarP1.toString().padStart(2, '0'));
        this.txtPlacarP2.setText(this.placarP2.toString().padStart(2, '0'));

        if (this.placarP1 >= 15 || this.placarP2 >= 15) {
            pararSom(this, 'jogoprincipal');

            let nomeVencedor = this.placarP1 >= 15 ? this.nomeP1 : this.nomeP2;

            this.time.delayedCall(600, () => {
                this.scene.start('DialogoVitoria', {
                    placarP1: this.placarP1,
                    placarP2: this.placarP2,
                    nomeVencedor: nomeVencedor,
                    nomeP1: this.nomeP1,
                    nomeP2: this.nomeP2
                });
            });
        } else {
            this.time.delayedCall(600, () => {
                this.resetBola(pontoParaP2 ? 2 : 1);
            });
        }
    }

    atualizarMinigames() {
        if (this.minigame.ativo) {
            this.minigame.posicaoLinha += this.minigame.velocidade * this.minigame.direcao;

            if (
                this.minigame.posicaoLinha >= this.minigame.larguraBarra ||
                this.minigame.posicaoLinha <= 0
            ) {
                this.minigame.direcao *= -1;
            }

            this.minigame.tempoRestante--;

            if (this.minigame.tempoRestante <= 0) {
                this.processarSaque(true);
            }
        }

        if (this.minigameLev.ativo) {
            this.minigameLev.posicaoLinha +=
                this.minigameLev.velocidade *
                this.minigameLev.direcao;

            if (
                this.minigameLev.posicaoLinha >= this.minigameLev.larguraBarra ||
                this.minigameLev.posicaoLinha <= 0
            ) {
                this.minigameLev.direcao *= -1;
            }
        }

        if (this.efeitoImpacto.ativo) {
            this.efeitoImpacto.raio += 4;

            if (this.efeitoImpacto.raio > 40) {
                this.efeitoImpacto.ativo = false;
            }
        }
    }

    efeitoAcerto(txt, cor) {
        this.textoEfeitoStr = txt;
        this.corEfeitoStr = cor;
        this.timerEfeito = 40;
    }

    desenharHUDGraphic() {
        this.uiGraphics.clear();

        if (this.timerEfeito > 0) {
            this.txtEfeito.setText(this.textoEfeitoStr).setStyle({
                fill: this.corEfeitoStr
            });

            this.timerEfeito--;
        } else {
            this.txtEfeito.setText('');
        }

        if (!this.bola.emEsperaDeSaque) {
            this.txtToques.setText(`TOQUES: ${this.numToquesLado}/3`);
            this.txtToques.setX(this.ladoAtualBola === 1 ? 170 : 740);

            this.txtToques.setStyle({
                fill: this.ladoAtualBola === 1 ? '#1e90ff' : '#ff3030'
            });
        } else {
            this.txtToques.setText('');
        }

        if (this.minigame.ativo) {
            let bx = this.minigame.x;
            let by = this.minigame.y;
            let bw = this.minigame.larguraBarra;
            let bh = this.minigame.alturaBarra;

            this.uiGraphics.fillStyle(0x000000, 1);
            this.uiGraphics.fillRect(bx - 5, by - 5, bw + 10, bh + 10);

            this.uiGraphics.lineStyle(2, 0xffffff);
            this.uiGraphics.strokeRect(bx - 5, by - 5, bw + 10, bh + 10);

            this.uiGraphics.fillStyle(0xff0000, 1);
            this.uiGraphics.fillRect(bx, by, bw, bh);

            this.uiGraphics.fillStyle(0xffea00, 1);
            this.uiGraphics.fillRect(bx + 40, by, bw - 80, bh);

            this.uiGraphics.fillStyle(0x00ff00, 1);
            this.uiGraphics.fillRect(bx + 75, by, 50, bh);

            this.uiGraphics.fillStyle(0xffffff, 1);
            this.uiGraphics.fillRect(
                bx + this.minigame.posicaoLinha - 2,
                by - 3,
                5,
                bh + 6
            );
        }

        if (this.minigameLev.ativo && this.minigameLev.jogadorAlvo) {
            let jog = this.minigameLev.jogadorAlvo;
            let bw = this.minigameLev.larguraBarra;
            let bh = this.minigameLev.alturaBarra;

            let bx = jog.x - bw / 2;
            let by = jog.y - 120;

            this.uiGraphics.fillStyle(0x000000, 1);
            this.uiGraphics.fillRect(bx - 3, by - 3, bw + 6, bh + 6);

            this.uiGraphics.lineStyle(2, 0xffffff);
            this.uiGraphics.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);

            this.uiGraphics.fillStyle(0xff0000, 1);
            this.uiGraphics.fillRect(bx, by, bw, bh);

            this.uiGraphics.fillStyle(0xffea00, 1);
            this.uiGraphics.fillRect(bx + bw * 0.2, by, bw * 0.6, bh);

            this.uiGraphics.fillStyle(0x00ff00, 1);
            this.uiGraphics.fillRect(bx + bw * 0.38, by, bw * 0.24, bh);

            this.uiGraphics.fillStyle(0xffffff, 1);
            this.uiGraphics.fillRect(
                bx + this.minigameLev.posicaoLinha - 2,
                by - 3,
                4,
                bh + 6
            );
        }

        if (this.efeitoImpacto.ativo) {
            this.uiGraphics.lineStyle(3, 0x00ff00);

            this.uiGraphics.strokeCircle(
                this.efeitoImpacto.x,
                this.efeitoImpacto.y,
                this.efeitoImpacto.raio
            );
        }
    }
}

class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver' });
    }

    init(data) {
        this.placarP1 = (data && data.placarP1) || 0;
        this.placarP2 = (data && data.placarP2) || 0;

        this.nomeP1 = (data && data.nomeP1) || 'Jogador 1';
        this.nomeP2 = (data && data.nomeP2) || 'Jogador 2';

        this.nomeVencedor =
            (data && data.nomeVencedor) ||
            (this.placarP1 > this.placarP2 ? this.nomeP1 : this.nomeP2);
    }

    create() {
        let p1Venceu = this.placarP1 > this.placarP2;

        tocarSom(this, 'victory', { loop: true, volume: 0.6 });

        this.add.rectangle(
            500,
            300,
            1000,
            600,
            p1Venceu ? 0x003300 : 0x000033
        );

        this.add.text(
            500,
            200,
            `${this.nomeVencedor.toUpperCase()} VENCEU!`,
            {
                fontSize: '48px',
                fill: '#fff',
                fontFamily: 'Determination'
            }
        ).setOrigin(0.5);

        this.add.text(
            500,
            300,
            `${this.nomeP1} ${this.placarP1} x ${this.placarP2} ${this.nomeP2}`,
            {
                fontSize: '28px',
                fill: '#fff',
                fontFamily: 'Determination'
            }
        ).setOrigin(0.5);

        let restartBtn = this.add.rectangle(500, 450, 340, 50, 0xffff00)
            .setInteractive({ useHandCursor: true });

        this.add.text(500, 450, 'VOLTAR AO MENU', {
            fontSize: '20px',
            fill: '#000',
            fontFamily: 'Determination'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => {
            pararSom(this, 'victory');
            this.scene.start('MenuStart');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1000,
        height: 600
    },

    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },

    physics: {
        default: 'arcade',

        arcade: {
            gravity: { y: 750 },
            debug: false
        }
    },

    scene: [
        MenuStart,
        SelectScene,
        DialogoLucas,
        DialogoVitoria,
        GamePlay,
        GameOver
    ]
};

function iniciarJogo() {
    new Phaser.Game(config);
}

if (document.fonts && document.fonts.load) {
    document.fonts.load('16px Determination').then(iniciarJogo).catch(iniciarJogo);
} else {
    iniciarJogo();
}