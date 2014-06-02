import fabric
import fabric.api

fabric.api.env.hosts = ['barb.cs.washington.edu']
fabric.api.env.user = 'jfogarty'


def keys_csr_create():
    # Ensure the server has our staging directory
    fabric.api.execute(keys_server_prepare)

    # Create our private key
    fabric.api.run('openssl genrsa -des3 -out {} 2048'.format(
        '~/fabric_staging/keys-recaf/private.key'
    ))

    # Create our certificate signing request
    fabric.api.run('openssl req -new -key {} -out {} -subj \'/emailAddress={}/CN={}/C={}\''.format(
        '~/fabric_staging/keys-recaf/private.key',
        '~/fabric_staging/keys-recaf/request.csr',
        'james.a.fogarty@gmail.com',
        'James Fogarty',
        'US'
    ))

    # Get our key and csr
    fabric.api.get(
        '~/fabric_staging/keys-recaf/private.key',
        'keys/private.key'
    )
    fabric.api.get(
        '~/fabric_staging/keys-recaf/request.csr',
        'keys/request.csr'
    )

    # Delete them from the server
    fabric.api.execute(keys_server_clean)


def keys_p12_create():
    # Ensure the server has our staging directory
    fabric.api.execute(keys_server_prepare)

    # Put our key and certificate
    fabric.api.put(
        'keys/private.key',
        '~/fabric_staging/keys-recaf/private.key',
    )
    fabric.api.put(
        'keys/ios_development.cer',
        '~/fabric_staging/keys-recaf/ios_development.cer',
    )

    # Convert the certificate to pem format
    fabric.api.run('openssl x509 -in {} -inform DER -out {} -outform PEM'.format(
        '~/fabric_staging/keys-recaf/ios_development.cer',
        '~/fabric_staging/keys-recaf/ios_development.pem'
    ))

    # Create the p12 file
    fabric.api.run('openssl pkcs12 -export -inkey {} -in {} -out {}'.format(
        '~/fabric_staging/keys-recaf/private.key',
        '~/fabric_staging/keys-recaf/ios_development.pem',
        '~/fabric_staging/keys-recaf/ios_development.p12'
    ))

    # Get our p12
    fabric.api.get(
        '~/fabric_staging/keys-recaf/ios_development.p12',
        'keys/ios_development.p12   '
    )

    # Delete them from the server
    fabric.api.execute(keys_server_clean)


def keys_server_clean():
    fabric.api.run('rm -rf {}'.format(
        '~/fabric_staging/keys-recaf'
    ))


def keys_server_prepare():
    # Ensure the server has our staging directory
    fabric.api.run('mkdir -p {}'.format(
        '~/fabric_staging/keys-recaf'
    ))



# def build():
#     fabric.api.local('jekyll build --config _config.yml')


# def deploy():
#     # Locally build the website
#     fabric.api.local('jekyll build --config _config.yml')
#
#     # Ensure the server has our staging directory
#     fabric.api.run('mkdir -p ~/fabric_staging/web-jayfo/')
#
#     # Ensure the staging directory is empty
#     fabric.api.run('rm -rf ~/fabric_staging/web-jayfo/*')
#
#     # Push up to the server staging directory
#     fabric.api.put('_site/*', '~/fabric_staging/web-jayfo/')
#
#     # And sync into the deployment directory
#     fabric.api.run('rsync -r -c --delete ~/fabric_staging/web-jayfo/ ~/public_html/')


# def serve():
#     fabric.api.local('jekyll serve --config _config.yml,_config-dev.yml --watch --force_polling')


# We cannot have a test because Fabric requires Python 2.7 but our tests use Python 3.4
#
# def test():
#    fabric.api.local('nosetests')
