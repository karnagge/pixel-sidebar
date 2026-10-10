# pixel-sidebar

Uma barra lateral para o [Claude Code](https://claude.com/claude-code) que mostra o que importa na sessão (modelo, contexto, custo, agentes e tarefas) e, embaixo, um palco em pixel art com personagens estilo SNES que conversam com você enquanto trabalha.

![Personagens](docs/personagens.png)

## O que tem

- **Painel**: modelo atual, barra de uso do contexto, custo da sessão, agentes ativos e a checklist de tarefas (TodoWrite).
- **Palco**: um cenário discreto em tons de cinza do tema. O céu muda com a hora do dia, o sol e a lua fazem seu arco e aparecem nuvens, chuva, uma árvore, grama e um passarinho de vez em quando. Só os personagens e os especiais são coloridos.
- **32 personagens** que se revezam a cada ~90 s: Mario, Link, Sonic, Crono, Tarnished, Pac-Man, Kirby, Mega Man, Samus, Pikachu, Master Chief, Goku, Ryu, Black Mage, Sans, Scorpion, Sub-Zero, MissingNo., Navi, o cachorro do Duck Hunt, Creeper, Simon Belmont, Bomberman, Donkey Kong, Yoshi, Guile, Cloud, Kratos, Madeline, um Space Invader, Arthur e um tripulante de Among Us.
- **Falas em balão de RPG**, com o texto surgindo letra a letra. São piadas, frases de motivação, comentários sobre o que está sendo feito (arquivo editado, tarefas, custo), hora do dia, dia da semana, datas especiais e o clima.
- **Especiais que quebram a quarta parede**: o golpe sai da barra lateral e atravessa a tela inteira numa faixa acima do prompt. Alguns exemplos: o Gaster Blaster do Sans, o arpão do Scorpion (que volta puxando um pedaço da tela), o Creeper explodindo, a bomba em cruz do Bomberman, o gelo do Sub-Zero que congela e racha, o MissingNo. corrompendo a tela, a Navi dando uma dica de verdade e o Arthur perdendo a armadura.
- **Encontros**: às vezes dois personagens dividem o palco. Mario e Sonic apostam corrida, Ryu duela com Guile, Scorpion com Sub-Zero, e o Pac-Man foge do fantasma até achar a pastilha de poder.
- **Kirby copia**: o Kirby inspira o personagem anterior e solta a especial dele, de chapéu.
- **Especial carregado**: quando uma tarefa passa mais de 5 minutos em andamento, ao terminar o especial sai maior, com brilho em volta.
- **Nível e conquistas**: tarefa concluída dá XP (50 se foi carregada), chefão derrotado e pomodoro também. Sobe de nível, ganha conquistas, e o progresso fica em `~/.claude/pixel-sidebar.json`.
- **Chefão**: três erros seguidos no Bash e um chefão (Bug Gigante, Segfault...) aparece no painel. O próximo comando que passar derrota o bicho.
- **Contexto e custo**: o personagem avisa ao passar de 60% e 85% do contexto e a cada US$ 10 gastos na sessão.
- **Notificações nativas**: avisa fora do terminal quando um turno de mais de 1 min termina, quando o Claude pede autorização e quando o contexto passa de 85%.
- **Pomodoro**: `/pomodoro` abre um cronômetro de foco no painel; no fim o personagem comemora e você ganha XP.
- **Reações**: quando uma tarefa é concluída, quando o Claude pede autorização ou quando o turno termina, o personagem comenta e solta o especial.

## Instalação

No Claude Code, digite:

```
/plugin install pixel-sidebar --marketplace karnagge/pixel-sidebar
```

Responda `y` para adicionar o marketplace e escolha o escopo (usuário é o padrão).

### Requisito: modo tela cheia

O painel só fica encaixado ao lado da conversa no layout de tela cheia, com o terminal tendo 110 colunas ou mais. Para ativar, adicione ao seu `~/.claude/settings.json`:

```json
{
  "env": { "CLAUDE_CODE_NO_FLICKER": "1" }
}
```

Fora da tela cheia, o painel abre inline.

## Comandos

| Comando | O que faz |
|---|---|
| `/sidebar` | Abre a barra lateral, caso ela tenha sido fechada |
| `/especial` | O personagem atual solta o especial agora |
| `/especial goku` | Chama um personagem específico (o nome pode ser parcial) |
| `/especial goku forte` | Especial carregado |
| `/pomodoro [min\|parar]` | Cronômetro de foco (padrão 25 min) |
| `/encontro` | Chama um encontro (ou `/encontro ryu`, por exemplo) |

## Configuração

Opções em `/config` (ou `pluginConfigs` no `settings.json`): `notificacoes` (liga/desliga os avisos nativos), `carregado_min` (minutos pro especial carregado, padrão 5), `custo_alerta_usd` (padrão 10) e `pomodoro_min` (padrão 25).

## Observações

- O clima vem de [wttr.in](https://wttr.in), pela localização do seu IP, no máximo uma vez por hora. Sem internet, o palco funciona normalmente, só que sem as falas sobre o clima.
- As falas estão em português brasileiro.
- Para desenvolver, rode `claude --plugin-dir .` a partir da pasta do repositório. Os testes rodam com `claude plugin test .`.

## Aviso sobre fan art

Este é um projeto de fã, sem fins comerciais. Os personagens são releituras em pixel art feitas à mão e pertencem aos seus respectivos donos (Nintendo, SEGA, Square Enix, FromSoftware, Bandai Namco, Capcom, Microsoft/Mojang, The Pokémon Company, Game Freak, Toei/Shueisha, Toby Fox, Warner Bros./NetherRealm, Konami, Sony Interactive Entertainment, Taito, Innersloth, Extremely OK Games e outros). O projeto não tem afiliação com nenhuma dessas empresas nem é endossado por elas. Se você é titular de algum desses direitos e quer que algo seja removido, abra uma issue e o conteúdo será retirado.

## Licença

O código está sob licença [MIT](LICENSE). A licença não se aplica aos personagens nem às marcas citadas acima.
