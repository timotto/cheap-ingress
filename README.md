# Cheap Ingress

[![Build Status](https://travis-ci.org/timotto/cheap-ingress.svg?branch=master)](https://travis-ci.org/timotto/cheap-ingress)
[![Coverage Status](https://coveralls.io/repos/github/timotto/cheap-ingress/badge.svg?branch=master)](https://coveralls.io/github/timotto/cheap-ingress?branch=master)
[![Dependency Status](https://david-dm.org/timotto/cheap-ingress.svg)](https://david-dm.org/timotto/cheap-ingress)
[![devDependency Status](https://david-dm.org/timotto/cheap-ingress/dev-status.svg)](https://david-dm.org/timotto/cheap-ingress#info=devDependencies)

This project is in hot development. Everything might change, most of it is still difficult to use.

I use this service to run a "private virtual network" within my home network so I can expose services running on my 
Raspberry Pi Kubernetes cluster to my local network almost like with a real 
[ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-controllers) like 
[Traefik](https://traefik.io) combined with a cloud DNS provider.


## How it works

The Linux backend uses the ```ip``` command to add additional IP addresses to a network interface and the ```iptables``` 
command to redirect traffic towards those IPs to the actual address and port. This allows the service to redirect any 
port no matter if it is already bound to 0.0.0.0 on the host. As a side effect it might also be more efficient than 
redirection through userspace, with fewer context switches ;-)

The built-in DNS server resolves hostnames from configured routes to the allocated virtual IP. I use dnsmasq on my home 
network which made it easy to forward queries for ```*.cloud.home``` to this service running on the IP ```192.168.0.11```:
```
server=/cloud.home/192.168.0.11
```

There is no integration into Kubernetes yet but it's obviously the point of this thing.

## Configuration

All configuration parameters have to be supplied as environment variables:

- ```STATE_FILENAME``` location of the file to store configured routes in - default: ```state.json```
- ```PORT``` port for the API server to listen on - default: ```8080``` 
- ```NODES``` list of IPs of nodes to send traffic to - default: ```169.254.123.125 169.254.123.126 169.254.123.127``` 
- ```INTERFACE``` network interface to use for the virtual IPs - default: ```eth0```
- ```IPPOOL_PREFIX``` static part of the IP pool to use for the virtual IPs, pattern has to match ```AAA.BBB.CCC.``` - 
default: ```169.254.123.```
- ```IPPOOL_HOSTMIN``` lower boundary of the IP pool - default ```100```
- ```IPPOOL_HOSTMAX``` upper boundary of the IP pool - default ```200```
- ```DOMAIN``` DNS domain of the built-in DNS server - default ```cheap-ingress.local```
- ```DNS_PORT``` port for the built-in DNS server to listen on - default ```53```
- ```DEBUG``` names of modules to show debug output from:
    - util
    - cheap-ingress:*

## Example

Given:
- my home network uses the subnet ```192.168.0.0/23``` 
- DHCP serves leases only from the ```192.168.0.0/24``` block
- DNS in my home network forwards requests for ```*.cloud.home``` to ```192.168.0.11```
- the Raspberry Pi Kubernetes cluster is running on ```192.168.1.20``` - ```192.168.1.25``` 
- the "futhek" service running on the Kubernetes cluster is exposed to nodePort ```32412```
- cheap-ingress is running inside a Docker container started with ```--privileged --network=host``` on a host with the IP ```192.168.0.11```
- configuration environment of cheap-ingress is
    ```
    NODES="192.168.1.20 192.168.1.21 192.168.1.22"
    INTERFACE=eth0
    IPPOOL_PREFIX=192.168.1.
    IPPOOL_HOSTMIN=100
    IPPOOL_HOSTMAX=199
    DOMAIN=cloud.home
    PORT=80
    DEBUG=cheap-ingress:*
    ```
- I have [httpie](https://github.com/jakubroztocil/httpie) on my local machine

When:
- I run
    ```bash
    http POST 192.168.0.11/api/route hostname=futhek port=80 protocol=tcp nodePort=32412
    ```

Then:
- I can access the "futhek" service with a browser on any device within my home network at
```http://futhek.cloud.home/```
