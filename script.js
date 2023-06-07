const reader = require("xlsx");

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

function buscarJogosPorTime(infoEquipes) {
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

const jogos = buscarJogosPorTime(jogosMaisProximos);

const primeiraLevaDeJogos = [];

for (let rodadas = 1; rodadas < Object.keys(jogos).length; rodadas++) {
  const matches = Object.keys(jogos);
  for (let teams = 0; teams < Object.keys(jogos).length / 2; teams++) {
    const clubeSelecionado = matches[0];
    const rivaisDoClube = jogos[clubeSelecionado];
    let partidaAgendada = 0;

    rivaisDoClube.jogos.map(partida => {
      if (partidaAgendada) return;
      if (jogos[clubeSelecionado].jogosMarcados.includes(partida.rival)) return;

      if (!matches.includes(partida.rival)) return;

      const jogosRemanescentes = matches
        .filter(match => !match.includes(partida.rival))
        .filter(match => !match.includes(clubeSelecionado));

      const tabelaViavel = verifadorDeJogosRemanescentes(jogosRemanescentes);

      if (rodadas === 1) jogos[clubeSelecionado].comeca = true;

      function verifadorDeJogosRemanescentes(arrayDosClubes) {
        if (!arrayDosClubes.length) return true;
        for (let c = 0; c < arrayDosClubes.length; c++) {
          const clube = arrayDosClubes[c];
          const inimigos = arrayDosClubes.filter(inimigo => inimigo !== clube);

          for (let p = 0; p < inimigos.length; p++) {
            if (!jogos[clube].jogosMarcados.includes(inimigos[p])) {
              if (jogos[clube].casa === 2 && jogos[inimigos[p]].casa === 2)
                continue;
              if (jogos[clube].fora === 2 && jogos[inimigos[p]].fora === 2)
                continue;
              const jogosQueFaltam = inimigos.filter(
                match => !match.includes(inimigos[p])
              );
              if (verifadorDeJogosRemanescentes(jogosQueFaltam)) return true;
            }
          }
          return false;
        }
        return false;
      }

      if (!tabelaViavel) {
        return;
      }
      // if (rodadas === Object.keys(jogos).length - 2) {
      //   if (jogos[clubeSelecionado].comeca) {
      //     primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);

      //     partidaAgendada = 1;
      //     matches.splice(matches.indexOf(clubeSelecionado), 1);
      //     matches.splice(matches.indexOf(partida.rival), 1);
      //     jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
      //     jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

      //     jogos[clubeSelecionado].casa = 0;
      //     jogos[clubeSelecionado].fora++;
      //     jogos[partida.rival].fora = 0;
      //     jogos[partida.rival].casa++;

      //     return;
      //   } else {
      //     primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

      //     partidaAgendada = 1;
      //     matches.splice(matches.indexOf(clubeSelecionado), 1);
      //     matches.splice(matches.indexOf(partida.rival), 1);
      //     jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
      //     jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

      //     jogos[clubeSelecionado].casa = 0;
      //     jogos[clubeSelecionado].fora++;
      //     jogos[partida.rival].fora = 0;
      //     jogos[partida.rival].casa++;

      //     return;
      //   }
      // }

      if (rodadas === Object.keys(jogos).length - 1) {
        if (jogos[partida.rival].primeirosJogosFora === 2) {
          primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);
          return;
        }

        if (jogos[clubeSelecionado].primeirosJogosCasa === 2) {
          primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);
          return;
        }
        if (!jogos[clubeSelecionado].comeca) {
          if (
            jogos[clubeSelecionado].casa < 2 &&
            jogos[partida.rival].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);
            partidaAgendada = 1;
            matches.splice(matches.indexOf(clubeSelecionado), 1);
            matches.splice(matches.indexOf(partida.rival), 1);
            jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
            jogos[clubeSelecionado].jogosMarcados.push(partida.rival);
            return;
          } else if (
            jogos[partida.rival].casa < 2 &&
            jogos[clubeSelecionado].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

            partidaAgendada = 1;
            matches.splice(matches.indexOf(clubeSelecionado), 1);
            matches.splice(matches.indexOf(partida.rival), 1);
            jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
            jogos[clubeSelecionado].jogosMarcados.push(partida.rival);
            return;
          }
          primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);
          return;
        } else {
          primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

          partidaAgendada = 1;
          matches.splice(matches.indexOf(clubeSelecionado), 1);
          matches.splice(matches.indexOf(partida.rival), 1);
          jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
          jogos[clubeSelecionado].jogosMarcados.push(partida.rival);
          return;
        }
      }

      if (rodadas === Object.keys(jogos).length - 2) {
        if (
          jogos[clubeSelecionado].casa === 1 &&
          jogos[clubeSelecionado].primeirosJogosFora > 0
        ) {
          primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

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

      if (partida.conexao) {
        if (jogos[clubeSelecionado].comeca || !jogos[clubeSelecionado].casa) {
          if (
            jogos[clubeSelecionado].casa < 2 &&
            jogos[partida.rival].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);
            partidaAgendada = 1;
            matches.splice(matches.indexOf(clubeSelecionado), 1);
            matches.splice(matches.indexOf(partida.rival), 1);
            jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
            jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

            jogos[clubeSelecionado].casa++;
            jogos[clubeSelecionado].fora = 0;
            jogos[partida.rival].casa = 0;
            jogos[partida.rival].fora++;
            if (rodadas === 1) {
              jogos[partida.rival].primeirosJogosFora = 1;
              jogos[clubeSelecionado].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosCasa === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosFora === 1
            ) {
              jogos[partida.rival].primeirosJogosFora = 2;
            }
            return;
          } else if (
            jogos[partida.rival].casa < 2 &&
            jogos[clubeSelecionado].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

            if (rodadas === 1) {
              jogos[clubeSelecionado].primeirosJogosFora = 1;
              jogos[partida.rival].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosCasa === 1
            ) {
              jogos[partida.rival].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosFora === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosFora = 2;
            }

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
          if (
            jogos[partida.rival].casa < 2 &&
            jogos[clubeSelecionado].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

            if (rodadas === 1) {
              jogos[clubeSelecionado].primeirosJogosFora = 1;
              jogos[partida.rival].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosCasa === 1
            ) {
              jogos[partida.rival].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosFora === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosFora = 2;
            }

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
            primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);
            partidaAgendada = 1;
            matches.splice(matches.indexOf(clubeSelecionado), 1);
            matches.splice(matches.indexOf(partida.rival), 1);
            jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
            jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

            jogos[clubeSelecionado].casa++;
            jogos[clubeSelecionado].fora = 0;
            jogos[partida.rival].casa = 0;
            jogos[partida.rival].fora++;

            if (rodadas === 1) {
              jogos[partida.rival].primeirosJogosFora = 1;
              jogos[clubeSelecionado].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosCasa === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosFora === 1
            ) {
              jogos[partida.rival].primeirosJogosFora = 2;
            }
            return;
          }
        }
      } else {
        if (!jogos[clubeSelecionado].comeca || jogos[clubeSelecionado].casa) {
          if (
            jogos[clubeSelecionado].casa < 2 &&
            jogos[partida.rival].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);
            partidaAgendada = 1;
            matches.splice(matches.indexOf(clubeSelecionado), 1);
            matches.splice(matches.indexOf(partida.rival), 1);
            jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
            jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

            jogos[clubeSelecionado].casa++;
            jogos[clubeSelecionado].fora = 0;
            jogos[partida.rival].casa = 0;
            jogos[partida.rival].fora++;
            if (rodadas === 1) {
              jogos[partida.rival].primeirosJogosFora = 1;
              jogos[clubeSelecionado].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosCasa === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosFora === 1
            ) {
              jogos[partida.rival].primeirosJogosFora = 2;
            }
            return;
          } else if (
            jogos[partida.rival].casa < 2 &&
            jogos[clubeSelecionado].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

            if (rodadas === 1) {
              jogos[clubeSelecionado].primeirosJogosFora = 1;
              jogos[partida.rival].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosCasa === 1
            ) {
              jogos[partida.rival].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosFora === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosFora = 2;
            }

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
          if (
            jogos[partida.rival].casa < 2 &&
            jogos[clubeSelecionado].fora < 2
          ) {
            primeiraLevaDeJogos.push(`${partida.rival} x ${clubeSelecionado}`);

            if (rodadas === 1) {
              jogos[clubeSelecionado].primeirosJogosFora = 1;
              jogos[partida.rival].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosCasa === 1
            ) {
              jogos[partida.rival].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosFora === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosFora = 2;
            }

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
            primeiraLevaDeJogos.push(`${clubeSelecionado} x ${partida.rival}`);
            partidaAgendada = 1;
            matches.splice(matches.indexOf(clubeSelecionado), 1);
            matches.splice(matches.indexOf(partida.rival), 1);
            jogos[partida.rival].jogosMarcados.push(clubeSelecionado);
            jogos[clubeSelecionado].jogosMarcados.push(partida.rival);

            jogos[clubeSelecionado].casa++;
            jogos[clubeSelecionado].fora = 0;
            jogos[partida.rival].casa = 0;
            jogos[partida.rival].fora++;
            if (rodadas === 1) {
              jogos[partida.rival].primeirosJogosFora = 1;
              jogos[clubeSelecionado].primeirosJogosCasa = 1;
            }
            if (
              rodadas === 2 &&
              jogos[clubeSelecionado].primeirosJogosCasa === 1
            ) {
              jogos[clubeSelecionado].primeirosJogosCasa = 2;
            }
            if (
              rodadas === 2 &&
              jogos[partida.rival].primeirosJogosFora === 1
            ) {
              jogos[partida.rival].primeirosJogosFora = 2;
            }
            return;
          }
        }
      }
    });
  }
}

const tabela = [];

primeiraLevaDeJogos.forEach((partida, index) => {
  const rodada = Math.floor(index / (Object.keys(jogos).length / 2));
  const [, casa, fora] = partida.match(/([\W\S]*) x ([\W\S]*)/);
  tabela.push({
    Rodada: rodada + 1,
    PrimeiroTurno: partida,
    SegundoTurno: `${fora} x ${casa}`,
  });
  primeiraLevaDeJogos.push(`${fora} x ${casa}`);
});

const workbook = reader.utils.book_new();
const worksheet = reader.utils.json_to_sheet(tabela);

const columnWidths = [{ wch: 7 }, { wch: 30 }, { wch: 30 }];
worksheet["!cols"] = columnWidths;
reader.utils.book_append_sheet(workbook, worksheet, "Jogos");

reader.writeFile(workbook, "tabela norte2.xlsx");
