# AWS Serverless Chat Platform

Plataforma de chat corporativo distribuído em tempo real com arquitetura serverless na AWS.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                    Vercel / CloudFront + S3                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐    ┌──────────▼──────────┐
     │   REST API GW   │    │  WebSocket API GW    │
     │   /api/v1/*     │    │  wss://...           │
     └────────┬────────┘    └──────────┬──────────┘
              │                         │
     ┌────────▼─────────────────────────▼──────────┐
     │              AWS Lambda Functions             │
     │  auth | messages | websocket | ai | admin    │
     └──┬──────────┬──────────┬──────────┬─────────┘
        │          │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌───▼────────┐
   │Cognito │ │DynamoDB│ │ SQS  │ │  Bedrock   │
   │  Auth  │ │  Data  │ │Queue │ │    AI      │
   └────────┘ └────────┘ └──┬───┘ └────────────┘
                             │
                    ┌────────▼────────┐
                    │   EventBridge   │
                    │    + SNS        │
                    └─────────────────┘
```

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Auth | AWS Cognito |
| API | API Gateway (REST + WebSocket) |
| Compute | AWS Lambda (Node.js 20) |
| Database | Amazon DynamoDB |
| Queue | Amazon SQS + DLQ |
| Events | Amazon EventBridge |
| Notifications | Amazon SNS |
| Storage | Amazon S3 |
| AI | Amazon Bedrock (Claude) |
| Monitoring | CloudWatch + X-Ray |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## Pré-requisitos

- Node.js 20+
- AWS CLI configurado
- Terraform 1.6+
- Docker & Docker Compose

## Setup Local

```bash
# Clone o repositório
git clone <repo-url>
cd aws-serverless-chat

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Subir ambiente local com Docker
docker-compose up -d

# Rodar frontend
cd frontend && npm run dev

# Rodar testes
cd backend && npm test
```

## Deploy

### Infraestrutura

```bash
cd infrastructure/environments/dev
terraform init
terraform plan
terraform apply
```

### Aplicação

```bash
# Deploy via GitHub Actions (automático no push)
git push origin main

# Deploy manual
cd backend
npm run deploy:dev
```

## Estrutura do Projeto

```
.
├── frontend/          # Next.js app
├── backend/           # Lambda functions (Clean Architecture)
│   ├── src/
│   │   ├── functions/ # Lambda handlers
│   │   ├── domain/    # Entities, repositories, use cases
│   │   ├── infrastructure/ # AWS implementations
│   │   └── shared/    # Middleware, utils
│   └── tests/
├── infrastructure/    # Terraform modules
│   ├── modules/
│   └── environments/
├── docs/              # Documentação e diagramas
└── .github/workflows/ # CI/CD pipelines
```

## Ambientes

| Ambiente | Branch | URL |
|----------|--------|-----|
| Dev | develop | dev.chat.example.com |
| Staging | staging | staging.chat.example.com |
| Prod | main | chat.example.com |

## Funcionalidades

- ✅ Autenticação via AWS Cognito (JWT)
- ✅ Mensagens em tempo real via WebSocket
- ✅ Processamento assíncrono com SQS
- ✅ Dead Letter Queue para retry automático
- ✅ Upload de arquivos via S3 presigned URLs
- ✅ Histórico de mensagens com paginação
- ✅ Indicador de status de entrega
- ✅ Rate limiting por usuário
- ✅ Moderação automática com Bedrock
- ✅ Resumo de conversas com IA
- ✅ Sugestão de respostas com IA
- ✅ Dashboard administrativo
- ✅ Logs estruturados + X-Ray tracing
- ✅ Métricas em tempo real no CloudWatch

## Escalabilidade

- Lambda escala automaticamente até 1000 execuções concorrentes por região
- DynamoDB com auto-scaling de capacidade
- SQS suporta volume ilimitado de mensagens
- API Gateway gerencia throttling automático
- CloudFront para distribuição global do frontend

## Estimativa de Custo (1000 usuários ativos/dia)

| Serviço | Custo Estimado/mês |
|---------|-------------------|
| Lambda | ~$2 |
| API Gateway | ~$5 |
| DynamoDB | ~$10 |
| SQS | ~$1 |
| Cognito | ~$5 |
| CloudWatch | ~$3 |
| S3 | ~$2 |
| **Total** | **~$28/mês** |
