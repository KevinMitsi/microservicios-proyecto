pipeline {
  agent any
  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    ansiColor('xterm')
    disableConcurrentBuilds()
  }
  environment {
    COMPOSE_FILE = 'docker-compose.yaml'
    COMPOSE_PROJECT_NAME = 'microservicios'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script { currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.BRANCH_NAME ?: 'local'}" }
      }
    }

    stage('Prechequeos') {
      steps {
        sh 'docker version'
        sh 'docker-compose --version || docker compose version'
        sh 'java -version || true'
        sh 'node -v || true'
        sh 'python3 --version || true'
      }
    }

    stage('Pruebas') {
      parallel {
        stage('msvc-logs - Jest') {
          steps {
            dir('msvc-logs') {
              sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'
              sh 'npm test'
            }
          }
        }
        stage('msvc-auth - Gradle tests') {
          steps {
            dir('msvc-auth') {
              sh './gradlew test --no-daemon'
            }
          }
        }
        stage('msvc-notifications - Build TypeScript') {
          steps {
            dir('msvc-notifications') {
              sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'
              sh 'npm run build'
            }
          }
        }
        stage('msvc-profiles - deps') {
          steps {
            dir('msvc-profiles') {
              sh 'python3 -m pip install --upgrade pip'
              sh 'python3 -m pip install -r requirements.txt'
              sh 'python3 -m py_compile main.py || true'
            }
          }
        }
      }
    }

    stage('Construir imágenes Docker') {
      steps {
        sh 'docker compose build || docker-compose build'
      }
    }

    stage('Despliegue con Docker Compose') {
      steps {
        sh '''
          (docker compose down --remove-orphans || docker-compose down --remove-orphans) || true
          (docker compose up -d || docker-compose up -d)
        '''
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'msvc-logs/coverage/**', allowEmptyArchive: true
      junit testResults: 'msvc-auth/build/test-results/test/*.xml', allowEmptyResults: true
      sh 'docker image prune -f || true'
    }
    success {
      echo 'Pipeline finalizado correctamente.'
    }
    failure {
      echo 'Pipeline falló. Revise los logs de las etapas.'
    }
  }
}
