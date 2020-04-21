# Lost Grandma
------------

Lost grandma roams the aisles of Sephora looking at their products and making note of stuff she'd have bought when she was younger.

Grandma is a master at organising large amounts of cosmetics data and she will not stop until she knows everything there is to know about cosmetics.

1. Lost grandma is a quick and effective crawler that used to crawl Sephora for product information
2. The crawler is no longer upto date but is effective in managing access across Tor exit nodes based in the US. 
3. It's rate limits itself to avoid being blocked and changes user-agents at random.
4. The tor agent auto-restarts itself periodically.
5. It designed to be parallel and each component can be executed independently. 
6. Docker and shell scripts build Tor and lost_grandma separately.
7. Uses Redis for queue management and crawl history. Upload Crawl History to s3 to avoid accessing old URLs again.
8. Uses Postgres as a permanent store with Sequelize as the ORM.
9. Was designed to work with Clarifai, Azure Custom Vision AI, Aws Rekognition and custom image classifiers.
10. No longer maintained. 



