// Requiring the module
const reader = require("xlsx");
const fs = require("fs");

// Reading our test file
const file = reader.readFile("./Matriz.xlsx");

let data = [];

const sheets = file.SheetNames;

for (let i = 0; i < sheets.length; i++) {
  const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
  temp.forEach(res => {
    data.push(res);
  });
}

const jogosMaisProximos = data.map(clubes => {
  const jogos = Object.entries(clubes).sort((a, b) => a[1] - b[1]);
  return {
    nome: jogos[0][1],
    clubeMaisProximo: jogos[0][1] === jogos[2][0] ? jogos[1] : jogos[2],
  };
});

function meuTime(infoEquipes) {
  const todasEquipes = infoEquipes;
  return infoEquipes.reduce((prev, equipe) => {
    const tabelaClube = data.find(clube => clube.__EMPTY === equipe.nome);
    const equipesRivais = todasEquipes.filter(
      clube => clube.nome !== equipe.nome
    );
    const jogos = [];

    const jogosMarcados = [];
    equipesRivais.forEach(rival => {
      if (jogosMarcados.includes(rival.nome)) return;
      jogosMarcados.push(rival.nome);
      if (rival.clubeMaisProximo.includes(equipe.nome)) {
        jogos.push({
          rival: rival.nome,
          kmPercorrido: tabelaClube[rival.nome],
          conexao: false,
        });
        return jogos;
      }
      const {
        nome,
        clubeMaisProximo: [rivalNome, kmPercorrido],
      } = rival;

      const [rivalProximo] = todasEquipes.filter(
        clube => clube.nome === rivalNome
      );

      if (rivalProximo.clubeMaisProximo.includes(nome)) {
        jogosMarcados.push(rivalProximo.nome);
        jogos.push(
          {
            rival: rival.nome,
            kmPercorrido: tabelaClube[rival.nome],
            conexao: rivalProximo.nome,
          },
          {
            rival: rivalProximo.nome,
            kmPercorrido: kmPercorrido + tabelaClube[rivalProximo.nome],
            conexao: rival.nome,
          }
        );
        return jogos;
      }

      jogos.push({
        rival: rival.nome,
        kmPercorrido: tabelaClube[rival.nome],
        conexao: false,
      });
      return jogos;
    });
    prev = { ...prev, [equipe.nome]: jogos };
    prev[equipe.nome] = {
      jogos,
      jogosMarcados: [],
      casa: 0,
      fora: 0,
      tabela: [],
    };
    return prev;
  }, {});
}

const jogos = meuTime(jogosMaisProximos);

const tabela = [];

for (let rodadas = 1; rodadas < Object.keys(jogos).length; rodadas++) {
  console.log("Rodada", rodadas);
  const matches = Object.keys(jogos);
  for (let teams = 0; teams < Object.keys(jogos).length / 2; teams++) {
    const clubeSelecionado = matches[0];
    const rivaisDoClube = jogos[clubeSelecionado];
    let partidaAgendada = 0;
    if (rodadas === 1) jogos[clubeSelecionado].comeca = true;

    rivaisDoClube.jogos.map(partida => {
      if (partidaAgendada) return;
      if (jogos[clubeSelecionado].jogosMarcados.includes(partida.rival)) return;

      if (!matches.includes(partida.rival)) return;

      const jogosRemanescentes = matches
        .filter(match => !match.includes(partida.rival))
        .filter(match => !match.includes(clubeSelecionado));

      if (jogosRemanescentes.length === 2) {
        if (
          jogos[jogosRemanescentes[0]].jogosMarcados.includes(
            jogosRemanescentes[1]
          )
        )
          return;
      }

      if (rodadas === Object.keys(jogos).length - 2) {
        if (
          jogos[clubeSelecionado].comeca &&
          jogos[clubeSelecionado].casa > 0
        ) {
          tabela.push(`${partida.rival} x ${clubeSelecionado}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

          jogos[clubeSelecionado].casa = 0;
          jogos[clubeSelecionado].fora++;
          jogos[partida.rival].fora = 0;
          jogos[partida.rival].casa++;

          return;
        }
      }

      if (jogos[clubeSelecionado].comeca || jogos[clubeSelecionado].casa) {
        if (jogos[clubeSelecionado].casa < 2 && jogos[partida.rival].fora < 2) {
          tabela.push(`${clubeSelecionado} x ${partida.rival}`);
          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

          jogos[clubeSelecionado].casa++;
          jogos[clubeSelecionado].fora = 0;
          jogos[partida.rival].casa = 0;
          jogos[partida.rival].fora++;
          if (rodadas === 0) {
            jogos[clubeSelecionado].primeiroJogo = true;
            jogos[partida.rival].primeiroJogo = false;
          }
          return;
        } else if (jogos[partida.rival].casa < 2) {
          tabela.push(`${partida.rival} x ${clubeSelecionado}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

          jogos[clubeSelecionado].casa = 0;
          jogos[clubeSelecionado].fora++;

          jogos[partida.rival].fora = 0;
          jogos[partida.rival].casa++;

          return;
        }
      } else {
        if (jogos[partida.rival].casa < 2) {
          tabela.push(`${partida.rival} x ${clubeSelecionado}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

          jogos[clubeSelecionado].casa = 0;
          jogos[clubeSelecionado].fora++;
          jogos[partida.rival].fora = 0;
          jogos[partida.rival].casa++;

          return;
        } else if (
          jogos[clubeSelecionado].casa < 2 &&
          jogos[partida.rival].fora < 2
        ) {
          tabela.push(`${clubeSelecionado} x ${partida.rival}`);
          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

          jogos[clubeSelecionado].casa++;
          jogos[clubeSelecionado].fora = 0;
          jogos[partida.rival].casa = 0;
          jogos[partida.rival].fora++;
          return;
        }
      }
    });
  }
}

tabela.forEach(partida => {
  const [, casa, fora] = partida.match(/([\W\S]*) x ([\W\S]*)/);
  tabela.push(`${fora} x ${casa}`);
});

const novaTabela = tabela.map((partida, index) => {
  const rodada = Math.floor(index / (Object.keys(jogos).length / 2));

  return { TABELA: `Rodada ${rodada + 1}: ${partida}` };
});

let workBook = reader.utils.book_new();
const workSheet = reader.utils.json_to_sheet(novaTabela);
reader.utils.book_append_sheet(workBook, workSheet, `response`);
let exportFileName = `mundinho.xls`;
reader.writeFile(workBook, exportFileName);

// const locura = jogos.map(clube => {
//   const tabela = [];
//   let jogoCasa = 1;
//   const [clubeNome] = Object.keys(clube);
//   const jogosMarcados = [];
//   clube[clubeNome].forEach(partida => {
//     if (jogosMarcados.includes(partida.rival)) return;
//     if (!partida.conexao) {
//       if (jogoCasa < 3) {
//         tabela.push(`${clubeNome} x ${partida.rival}`);
//         jogosMarcados.push(partida.rival);
//         jogoFora = 1;
//       } else {
//         tabela.push(`${partida.rival} x ${clubeNome}`);
//         jogosMarcados.push(partida.rival);
//         jogoCasa = 1;
//       }
//     } else {
//       if (jogoCasa < 2) {
//         tabela.push(`${clubeNome} x ${partida.rival}`);
//         jogosMarcados.push(partida.rival);

//         const segundaFora = clube[clubeNome].find(
//           clubeAtual => clubeAtual.conexao === partida.rival
//         );
//         tabela.push(`${clubeNome} x ${segundaFora.rival}`);
//         jogosMarcados.push(segundaFora.rival);

//         jogoCasa = 3;
//       } else {
//         tabela.push(`${partida.rival} x ${clubeNome}`);
//         jogosMarcados.push(partida.rival);

//         const segundaFora = clube[clubeNome].find(
//           clubeAtual => clubeAtual.conexao === partida.rival
//         );
//         tabela.push(`${segundaFora.rival} x ${clubeNome}`);
//         jogosMarcados.push(segundaFora.rival);
//         jogoCasa = 1;
//       }
//     }
//   });
//   return tabela;
// });

// console.log(locura);
