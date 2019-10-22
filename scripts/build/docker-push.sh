#!/usr/bin/env bash
function login_ecs(){
    echo "Logging to ECR"
    $(aws ecr get-login --no-include-email)

    if [ $? -eq 0 ]
    then
        echo "Successfully logged into ECR"
    else
        echo "Login failed"
        exit 1
    fi
}

function get_branch_name(){
    echo "Getting branch name..."

    BRANCH_NAME="$(git branch | grep \* | cut -d ' ' -f2)"
    if [ $? -eq 0 ]; then        
        echo "branch_name: ${BRANCH_NAME}"
    else
        echo "branch_name could not be fetched"
        exit 1
    fi

}

function get_commit_id(){
    echo "Getting commit id..."
    COMMIT_ID="$(git log --format="%H" -n 1)"
    if [ $? -eq 0 ]; then        
        echo "commit_id: ${COMMIT_ID}"
    else
        echo "commit_id could not be fetched"
        exit 1
    fi
}

function lost_grandma_build_and_push(){
    echo "Building repository"
    pwd

    docker build -t goglance/lost-grandma:"${BRANCH_NAME}_${COMMIT_ID}" .
    docker tag goglance/lost-grandma:"${BRANCH_NAME}_${COMMIT_ID}" goglance/lost-grandma:latest
    docker tag goglance/lost-grandma:"${BRANCH_NAME}_${COMMIT_ID}" "${AWS_ECR_REPOSITORY_URI}:${BRANCH_NAME}_${COMMIT_ID}"
    docker tag goglance/lost-grandma:"${BRANCH_NAME}_${COMMIT_ID}" "${AWS_ECR_REPOSITORY_URI}:latest"
    docker push "${AWS_ECR_REPOSITORY_URI}:${BRANCH_NAME}_${COMMIT_ID}"
}

function export_image_locally(){
    export LOST_GRANDMA_IMAGE_ID="goglance/lost-grandma:${BRANCH_NAME}_${COMMIT_ID}"    
}

function build_tor_and_push(){
    echo "Building tor..."
    cd ./scripts/tor
    
    timestamp=$(date '+%s')
    echo "Tag timestamp: ${timestamp}"
    docker build -t goglance/tor:"tor-${timestamp}" .
    docker tag goglance/tor:"tor-${timestamp}" goglance/tor:latest
    docker tag goglance/tor:"tor-${timestamp}" "${AWS_ECR_REPOSITORY_URI_TOR}:tor-${timestamp}"
    docker tag goglance/tor:"tor-${timestamp}" "${AWS_ECR_REPOSITORY_URI_TOR}:latest"
    docker push "${AWS_ECR_REPOSITORY_URI_TOR}:tor-${timestamp}"    
}

function export_tor_image_locally(){
    export TOR_IMAGE_ID="goglance/tor:tor-${timestamp}"
}

function lost_grandma(){
    login_ecs
    get_branch_name
    get_commit_id
    lost_grandma_build_and_push
    export_image_locally
}

function tor(){
    login_ecs
    build_tor_and_push        
    export_tor_image_locally
}

function main(){
    echo "Inside main"
    arg1=$1
    arg2=$2

    echo "${arg1} ${arg2}"
    if [ "$arg1" = "tor" ]; then
        tor
        cd ../..
    elif [ "$arg1" = "lost_grandma" ]; then 
        echo "Only build lost-grandma"
        lost_grandma
    else
        lost_grandma
        tor
        cd ../..
    fi
}


main $1 $2

