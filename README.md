# VERONA CAMPAGNA — Gioielli

Loja de joias exclusiva — vitrine, catálogo, página de produto, atacado com
faixas de desconto, checkout e conta — em HTML, CSS e JavaScript puros.
Sem framework, sem build, sem dependências de servidor.

- **Varejo:** prata 925 e banho de ouro 18k, frete grátis acima de R$ 299,
  5% off no Pix, 12x sem juros.
- **Atacado:** a partir de 10 peças — **25% off** (10+), **35% off** (25+) e
  **45% off** (50+), com cadastro de lojista em `atacado.html`.
- **Primeira visita** abre com uma animação 3D (three.js): partículas
  douradas formam um anel e a câmera atravessa o aro. A partir da segunda
  visita o site abre direto, **sem a introdução e sem as animações de
  scroll** (flag `vc_intro_v1` no localStorage).

## Rodar na sua máquina

- **Sem servidor:** dê um duplo clique em `ABRIR-LOJA.cmd`.
- **Com servidor local (opcional):** `node tools/serve.mjs` e acesse
  `http://localhost:4173`. Requer Node 22+.

## Publicar no GitHub Pages

1. Suba o repositório para o GitHub (branch `main`).
2. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
3. O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
   publica a cada push. O link fica `https://<usuario>.github.io/<repo>/`.

> Na Pages a loja roda no **modo local**: sacola, perfil, endereços e pedidos
> ficam no armazenamento do navegador de quem visita. Nenhum dado de cartão é
> guardado — quando aplicável, apenas bandeira e os 4 últimos dígitos.

## Checagens

```bash
node tools/check-globals.js     # colisões de nomes no escopo global
node tools/browser-check.mjs    # roteiro completo no Chrome headless
node tools/prep-images.ps1      # regenera as imagens a partir das fotos originais
```

## Estrutura

```
index.html        home (abertura 3D, vitrine, editorial, atacado, newsletter)
catalogo.html     catálogo com filtros (?cat=aneis|brincos|colares|pingentes|pulseiras)
produto.html      página da joia (?id=<slug>) — galeria, tamanhos, faixas de atacado
atacado.html      programa de revenda: faixas, como funciona, cadastro, FAQ
sobre.html        história do ateliê     contato.html   atendimento e ajuda
checkout.html     checkout convidado em 5 passos (Pix, cartão, boleto)
conta.html        dados, pedidos e endereço salvos no navegador      404.html
data.js           marca, catálogo, carrinho, atacado, busca e chrome (header/rodapé)
intro.js          abertura 3D em three.js (só na primeira visita)
motion.js         animações GSAP (só quando não há cache)
theme.js          tema claro/escuro       script.js   home
pages.js          catálogo/atacado/sobre/contato        produto.js  PDP
checkout.js       checkout                pay-core.js bandeiras, máscaras, Pix, CEP
conta.js          conta local             styles.css  pages.css  pay.css
images/           fotos tratadas (aneis, brincos, colares, pingentes, pulseiras, editorial)
vendor/           three.js, GSAP e ScrollTrigger (locais)
tools/            checagens, servidor local e preparo das imagens
```
