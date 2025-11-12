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
          post {
            always {
              publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'msvc-logs/coverage',
                reportFiles: 'index.html',
                reportName: 'Logs Coverage Report'
              ])
            }
          }
        }
        stage('msvc-auth - Gradle tests') {
          steps {
            dir('msvc-auth') {
              sh './gradlew clean test --no-daemon'
            }
          }
          post {
            always {
              junit testResults: 'msvc-auth/build/test-results/test/*.xml', allowEmptyResults: true
              publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'msvc-auth/build/reports/tests/test',
                reportFiles: 'index.html',
                reportName: 'Auth Test Report'
              ])
            }
          }
        }
        stage('msvc-notifications - TypeScript tests') {
          steps {
            dir('msvc-notifications') {
              sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'
              sh 'npm run build'
              sh 'npm test'
            }
          }
          post {
            always {
              publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'msvc-notifications/coverage',
                reportFiles: 'index.html',
                reportName: 'Notifications Coverage Report'
              ])
            }
          }
        }
        stage('msvc-profiles - Python tests') {
          steps {
            dir('msvc-profiles') {
              sh 'python3 -m pip install --upgrade pip'
              sh 'python3 -m pip install -r requirements.txt'
              sh 'python3 -m pytest tests/ -v --cov=app --cov-report=xml --cov-report=html --junit-xml=test-results.xml'
            }
          }
          post {
            always {
              junit testResults: 'msvc-profiles/test-results.xml', allowEmptyResults: true
              publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'msvc-profiles/coverage_html',
                reportFiles: 'index.html',
                reportName: 'Profiles Coverage Report'
              ])
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
      // Archivar reportes de cobertura
      archiveArtifacts artifacts: 'msvc-logs/coverage/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'msvc-notifications/coverage/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'msvc-profiles/coverage_html/**', allowEmptyArchive: true

      // Reportes JUnit consolidados
      junit testResults: 'msvc-auth/build/test-results/test/*.xml', allowEmptyResults: true
      junit testResults: 'msvc-profiles/test-results.xml', allowEmptyResults: true

      sh 'docker image prune -f || true'
    }
    success {
      echo 'Pipeline finalizado correctamente. Todos los tests pasaron.'
    }
    failure {
      echo 'Pipeline falló. Revise los logs de las etapas de testing.'
    }
  }
}
