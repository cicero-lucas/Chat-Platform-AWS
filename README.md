# AWS Serverless Chat Platform

Plataforma de chat corporativo distribuído em tempo real com arquitetura serverless na AWS.

<div style="display:flex; gap:6px; justify-content:center;">
   <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/AWS%20Cognito-FF9900?logo=amazonaws&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/API%20Gateway-FF4F8B?logo=amazonapigateway&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/AWS%20Lambda-FF9900?logo=awslambda&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/DynamoDB-4053D6?logo=amazondynamodb&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/SQS-FF9900?logo=amazonsqs&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/EventBridge-FF4F8B?logo=amazoneventbridge&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/SNS-FF9900?logo=amazonsns&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/Amazon%20S3-569A31?logo=amazons3&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/Amazon%20Bedrock-232F3E?logo=amazonaws&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/CloudWatch-FF9900?logo=amazoncloudwatch&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/X--Ray-FF9900?logo=amazonaws&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/Terraform-7B42BC?logo=terraform&logoColor=white" height="24" />
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white" height="24" />
</div>


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
