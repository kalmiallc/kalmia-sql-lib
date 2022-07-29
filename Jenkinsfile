def getGitCommit() {
    return sh(returnStdout: true, script: 'git describe --always')
}


def notifyBuild(String buildStatus = 'SUCESSFULL', String additionalMessage = '') {
  // build status of null means successful
  buildStatus =  buildStatus ?: 'SUCCESSFUL'

  // Default values
  def colorName = 'RED'
  def colorCode = '#FF0000'
  def subject = "${buildStatus}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'"
  def summary = "${subject} (${env.BUILD_URL})"
  if(additionalMessage) {
    summary = summary + ", ${additionalMessage}"
  }

  // Override default values based on build status
  if (buildStatus == 'STARTED') {
    color = 'YELLOW'
    colorCode = '#FFFF00'
  } else if (buildStatus == 'SUCCESSFUL') {
    color = 'GREEN'
    colorCode = '#00FF00'
  } else {
    color = 'RED'
    colorCode = '#FF0000'
  }

  // Send notifications
  slackSend (channel: '#ci-monitor', color: colorCode, message: summary)
}

pipeline {
     parameters {
        choice(name: 'LOG_OUT_LEVEL', choices: ['INF', 'DBG', 'VBS'], description: 'Log level')
        string(name: 'MYSQL_DB_TEST', defaultValue: 'test-lib-db', description: '')
        string(name: 'MYSQL_PORT_TEST', defaultValue: '3306', description: '')
        string(name: 'MYSQL_PORT', defaultValue: '3306', description: '')
        string(name: 'MYSQL_USER_TEST', defaultValue: 'root', description: '')
        string(name: 'MYSQL_PASSWORD_TEST', defaultValue: 'test', description: '')
        string(name: 'MYSQL_PASSWORD', defaultValue: 'test', description: '')
        string(name: 'MYSQL_DB', defaultValue: 'test-lib-db', description: '')
        string(name: 'LOG_TARGET', defaultValue: 'NONE', description: '')

    }
        

  /*
   * This agent will need docker, git, node and npm installed at a minimum.
   */
  agent {
    node {
      label 'built-in'
    }
  }

  environment {
    IMAGE = "kalmia-sql-li"
    RELEASE = "test-run"
  }

  stages {
     stage ('Clone repository') {
         steps {
             checkout([$class: 'GitSCM', 
            branches: [[name: '*/develop']], 
            doGenerateSubmoduleConfigurations: false, 
            submoduleCfg: [], 
            userRemoteConfigs: [[url: 'git@bitbucket.org:kalmiadevs/kalmia-sql-lib.git',
            credentialsId: '8a443d76-7679-4b3a-89c1-c159fb612180']]
])
         }
     }

     stage('Check for new commit') {
      steps {
        sh '''
          #!/bin/bash -xe
          # check if $GIT_COMMIT and $GIT_PREVIOUS_COMMIT are present. If either of those
          # two is missing, we allow build to proceed. If both are present, we check whether
          # current commit is equal to the last one. $GIT_COMMIT and $GIT_PREVIOUS_COMMIT are
          # equal, this means the build was triggered by a different branch — there are no
          # changes in this current branch. Since there are no changes, there's no need to
          # waste time building stuff for nothing.
          echo "GIT COMMIT:  $GIT_COMMIT"
          echo "PREV COMMIT: $GIT_PREVIOUS_COMMIT"
          echo "FORCE BUILD: $FORCE_BUILD"
          if [ ! -z "$GIT_COMMIT" ] ; then
            if [ ! -z "$GIT_PREVIOUS_COMMIT" ] ; then
              if [ "$GIT_COMMIT" = "$GIT_PREVIOUS_COMMIT" ] ; then
                if [ $FORCE_BUILD = false ] ; then
                  echo "--------------------------------------------"
                  echo "    Nothing has changed. Aborting build."
                  echo "--------------------------------------------"
                  exit 1;
                fi
              fi
            fi
          fi
        '''
      }
      post {
        success {
          echo('Changes were commited. Starting build ...')
        }
        failure {
          echo("Aborted build")
          script {
            currentBuild.result = 'ABORTED'
            currentBuild.currentResult = 'ABORTED'
          }
        }
      }
    }

     stage('Free up space') {
         steps {
             sh '''
               echo "$USER"       
               docker image prune -a -f
             '''
         }
     }

     stage('Build Image') {
       steps {
           sh '''
             export VERSION=$(node -p "require(\'./package.json\').version")
             echo "Preparing image docker.kalmia.si/web/${IMAGE}:${RELEASE}-$F"       
             AUTH_REPO_ACCESS_KEY="$(cat kalmia-auth-repo-access.key)" docker-compose -f docker-compose.test.yaml build --force
           '''
        }
      }
      
      stage('Test build') {
          steps {
              sh '''
               AUTH_REPO_ACCESS_KEY="$(cat kalmia-auth-repo-access.key)" docker-compose -f docker-compose.test.yaml up --force-recreate --abort-on-container-exit --exit-code-from api
              '''
          }
          post {
            success {
              echo('Build and tests successful')
              notifyBuild("SUCCESSFUL", "Build and tests passed for build GIT sha: ${getGitCommit()}")
            }
            failure {
              echo('Build and tests failed')
              script {
                currentBuild.result = 'FAILURE'
                notifyBuild("FAIL", "Build and tests failed for build GIT sha: ${getGitCommit()}")
              }
            }
          }
      }
  }
}
