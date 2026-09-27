# ComuniVisual AI

Protótipo inicial de ERP para empresas de comunicação visual, pensado para operar a partir de uma única Central de Serviços.

## O que já existe nesta primeira versão
- Central de Serviços com etapas: Orçamento → Aprovado → Arte → Produção → Instalação → Concluído
- Filtros de serviços
- Ficha lateral da OS e avanço/retrocesso de etapa
- Assistente IA demonstrativo
- Financeiro separado
- Tela de personalização por empresa (nome, iniciais/logo e cores)
- Layout responsivo
- Schema inicial Supabase multiempresa
- Catálogo inicial de serviços de comunicação visual

## Como rodar
```bash
npm install
npm run dev
```
Acesse http://localhost:3000

## Arquitetura prevista
Next.js + Supabase + GitHub + Vercel. O projeto pode ser aberto e editado no Dyad.

## Próximas etapas
1. Conectar Supabase Auth e Row Level Security por empresa.
2. Transformar os dados simulados em dados reais.
3. Expandir catálogo mestre para 300–500 serviços/materiais.
4. Criar motor de precificação e fichas técnicas.
5. Integrar IA para interpretar pedidos e gerar orçamento/lista de materiais/checklist.
6. Arquivos, aprovação de arte e WhatsApp.
7. Estoque, compras, DRE e conciliação.
8. White-label completo: logo enviada, favicon, PDFs, orçamento e domínio do cliente.
