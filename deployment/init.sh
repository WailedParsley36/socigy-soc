#!/bin/bash

helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jetstack https://charts.jetstack.io
helm repo add zalando https://opensource.zalando.com/postgres-operator/charts/postgres-operator/
helm repo update

# Namespaces
kubectl create namespace socigy
kubectl create namespace consul
kubectl create namespace monitoring
kubectl create namespace kubernetes-dashboard
kubectl create namespace vault

kubectl create namespace cert-manager
kubectl label namespace cert-manager pod-security.kubernetes.io/enforce=restricted --overwrite

# Dashboard
kubectl apply -f kube/dashboard
helm install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard -n kubernetes-dashboard -f dashboard-values.yml

kubectl -n kubernetes-dashboard create token normal-user
kubectl -n kubernetes-dashboard create token dashboard-admin

# Cert Manager
kubectl create secret generic cloudflare-api-token --from-literal=api-token=%CLOUDFLARE_DNS_API_TOKEN% -n cert-manager
helm install cert-manager jetstack/cert-manager -n cert-manager --set crds.enabled=true --set prometheus.enabled=true
kubectl apply -f ./kube/certs

# Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace -f ingress-values.yml
kubectl apply -f ./kube/ingresses

# Monitoring
kubectl apply -f ./kube/monitoring/grafana
kubectl create secret generic grafana-users-secret -n monitoring --from-literal=adminuserpassword=%GRAFANA_ADMIN_PASSWD% --from-literal=editoruserpassword=%GRAFANA_EDITOR_PASSWD% --from-literal=vieweruserpassword=%GRAFANA_VIEWER_PASSWD%
kubectl create secret generic grafana-admin-secret -n monitoring --from-literal=admin-user=%GRAFANA_ROOT_USERNAME% --from-literal=admin-password=%GRAFANA_ROOT_PASSWD%

helm install grafana grafana/grafana -n monitoring -f grafana-values.yml

helm install loki grafana/loki-stack -f loki-values.yml -n monitoring

# prometheus-community/prometheus
helm install prometheus prometheus-community/prometheus -n monitoring -f prometheus-values.yml
kubectl patch ds prometheus-prometheus-node-exporter --type "json" -p '[{"op": "remove", "path" : "/spec/template/spec/containers/0/volumeMounts/2/mountPropagation"}]' -n monitoring

# kubectl rollout status deployment prometheus-server --namespace default --timeout=300s
#
#
#
#

# Vault
kubectl apply -f kube/vault
# kubectl delete -f kube/vault
helm install vault hashicorp/vault -n vault -f vault-values.yml

# Consul
helm install consul hashicorp/consul -f consul-values.yml --create-namespace -n consul
kubectl apply -f ./kube/monitoring
kubectl apply -f ./kube/
kubectl apply -f ./kube/microservices
kubectl apply -f ./kube/gateway
kubectl apply -f ./kube/intentions
kubectl apply -f ./kube/roles

kubectl apply -f ./kube/terminating

# Databases
helm install main zalando/postgres-operator # --namespace databases --create-namespace
kubectl apply -f ./kube/databases/operator.yml
