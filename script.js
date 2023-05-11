// Requiring the module
const reader = require("xlsx");
const fs = require("fs");

// Reading our test file
const file = reader.readFile("./Matriz Distâncias.xlsx");

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
  return infoEquipes.map(equipe => {
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
    return { [equipe.nome]: jogos };
  });
}

const jogos = meuTime(jogosMaisProximos);
console.log(JSON.stringify(jogos));

const locura = jogos.map(clube => {
  const tabela = [];
  let jogoCasa = 1;
  let jogoFora = 1;
  const [clubeNome] = Object.keys(clube);
  const jogosMarcados = [];
  clube[clubeNome].forEach(partida => {
    if (jogosMarcados.includes(partida.rival)) return;
    if (!partida.conexao) {
      if (jogoCasa < 3) {
        tabela.push(`${clubeNome} x ${partida.rival}`);
        jogosMarcados.push(partida.rival);
        jogoCasa++;
        jogoFora = 1;
        return;
      } else {
        tabela.push(`${partida.rival} x ${clubeNome}`);
        jogosMarcados.push(partida.rival);
        jogoFora++;
        jogoCasa = 1;
      }
    } else {
      if (jogoCasa < 2) {
        tabela.push(`${clubeNome} x ${partida.rival}`);
        jogosMarcados.push(partida.rival);

        const segundaFora = clube[clubeNome].find(
          clubeAtual => clubeAtual.conexao === partida.rival
        );
        tabela.push(`${clubeNome} x ${segundaFora.rival}`);
        jogosMarcados.push(segundaFora.rival);

        jogoFora = 1;
        jogoCasa = 3;
        return;
      } else {
        tabela.push(`${partida.rival} x ${clubeNome}`);
        jogosMarcados.push(partida.rival);

        const segundaFora = clube[clubeNome].find(
          clubeAtual => clubeAtual.conexao === partida.rival
        );
        tabela.push(`${segundaFora.rival} x ${clubeNome}`);
        jogosMarcados.push(segundaFora.rival);

        jogoFora = 3;
        jogoCasa = 1;
        return;
      }
    }
  });
  tabela.forEach(partida => {
    const [, casa, , fora] = partida.match(/(\S+)( x )(\S+)/);
    tabela.push(`${fora} x ${casa}`);
  });
  return tabela;
});

console.log(locura[0]);
