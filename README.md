# Frango Fit 🐔

Ficha de treino com **carga progressiva** e um Frango que evolui junto com você. Feito para usar no celular, no meio da série: sem login, sem servidor, funciona offline e dá para instalar na tela inicial.

## O que ele faz

- **Fichas de treino**: monte o treino A, B, C... com séries, repetições e descanso. Biblioteca com 39 exercícios e dá para criar os seus.
- **Treino ativo**: mostra o que você fez da última vez e já sugere a carga. Bateu todas as reps? Ele sobe o peso. Não bateu? Repete até bater.
- **Timer de descanso** que começa sozinho quando você marca a série, com som 8-bit e vibração no celular.
- **Recordes pessoais (PR)**: detecta na hora quando uma série bate seu recorde, pelo 1RM estimado (fórmula de Epley).
- **Progresso**: gráfico de evolução por exercício, volume semanal, mapa de frequência estilo GitHub e histórico completo.
- **O Frango sobe de nível** com o seu volume, treinos e recordes: Frango → Frango Fit → Marombeiro → Monstro → Bambam.
- **Ferramentas**: calculadora de anilhas (mostra a barra montada com as cores olímpicas) e calculadora de 1RM com tabela de porcentagens.
- **Seus dados são seus**: tudo fica no aparelho. Backup e importação em JSON.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Em **Ferramentas → Carregar exemplo** dá para ver o app com 6 semanas de treino.

## Como funciona por dentro

| Parte | Onde |
| --- | --- |
| Estado e persistência (zustand + localStorage) | `src/lib/store.ts` |
| Cálculos: volume, 1RM, PRs, sugestão de carga, nível, anilhas | `src/lib/calc.ts` |
| Biblioteca de exercícios | `src/lib/exercises.ts` |
| Telas | `src/app/*/page.tsx` |
| Pixel art do Frango e das anilhas | `src/components/pixel.tsx` |
| Sons 8-bit (Web Audio, sem arquivos) | `src/lib/sfx.ts` |

Next.js 16, React 19, Tailwind CSS 4, TypeScript e zustand. Todas as páginas são estáticas: dá para publicar na Vercel sem configurar nada.

## Publicar

Na Vercel: **Add New → Project**, importe este repositório e clique em **Deploy**.

---

Feito por [João Vaz](https://github.com/Bleachless). O Frango também mora no meu portfólio.
