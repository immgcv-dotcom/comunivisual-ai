# ComuniVisual AI

ERP para empresas de comunicação visual, com uma Central de Serviços que integra atendimento, orçamento, arte, produção, instalação, estoque e financeiro.

## Funcionalidades atuais
- Central de Serviços: Atendimento → Orçamento → Aprovado → Arte → Produção → Instalação → Concluído
- Clientes PF/PJ e consulta de CNPJ
- Orçamentos com itens, desconto, condições, validade, observações, impressão/PDF e compartilhamento por WhatsApp
- Aprovação pública de orçamento com sincronização de PCP, financeiro e histórico
- Catálogo de serviços e fichas técnicas de materiais
- Precificação por materiais, perdas, horas de produção/instalação/máquina, deslocamento, impostos, comissão e margem mínima
- Estoque com movimentações, reservas por OS, consumo e bloqueio por falta de material
- Entrada de estoque por XML de NF-e, com associação de novos materiais
- PCP com setores, responsáveis, checklist e controle de andamento
- Versões de arte e aprovação antes da liberação para produção
- Planejamento de instalação com data, equipe, endereço e observações
- Financeiro com contas a pagar/receber e resultado real por OS
- Personalização da empresa: dados cadastrais, logo e cores
- White-label por implantação, preservando isolamento entre empresas

## Arquitetura atual
- Next.js 15 + TypeScript
- PostgreSQL via Neon serverless
- GitHub Actions para validação de build
- Produção em Cloudflare

## Variáveis de ambiente
Copie `.env.example` e configure:

- `DATABASE_URL`: conexão PostgreSQL/Neon.
- `DEFAULT_COMPANY_SLUG`: identificador da empresa desta implantação.
- `DEFAULT_COMPANY_NAME`: nome inicial da empresa desta implantação.

Os valores padrão mantêm a instalação atual da Immagine. Para um novo cliente, use outra implantação e outro banco/configuração de ambiente. Este projeto não deve ser tratado como multi-tenant compartilhado sem uma camada própria de autenticação e isolamento de tenant.

## Desenvolvimento local
```bash
npm install
npm run dev
```

A aplicação local fica disponível em `http://localhost:3000`.

## Validação de produção
Cada push na branch `main` executa o workflow **Production Check**, que instala dependências, compila Next.js/TypeScript e verifica a saúde da aplicação publicada.

## Próximos passos comerciais
- Autenticação e perfis de acesso antes de oferecer uma única implantação compartilhada por várias empresas.
- Upload/armazenamento próprio de arquivos de arte, caso seja necessário eliminar URLs externas.
- Domínio, favicon e identidade final por cliente na implantação comercial.
