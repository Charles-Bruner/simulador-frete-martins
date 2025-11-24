import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, MapPin, Weight, DollarSign } from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";

export default function Home() {
  const [ufOrigem, setUfOrigem] = useState("");
  const [classificacaoOrigem, setClassificacaoOrigem] = useState("");
  const [ufDestino, setUfDestino] = useState("");
  const [classificacaoDestino, setClassificacaoDestino] = useState("");
  const [peso, setPeso] = useState("");
  const [valorMercadoria, setValorMercadoria] = useState("");
  const [produtoQuimico, setProdutoQuimico] = useState(false);
  const [aplicarTDE, setAplicarTDE] = useState(false);

  const { data: ufs, isLoading: isLoadingUFs } = trpc.frete.getUFs.useQuery();
  const { data: classificacoesOrigem, isLoading: isLoadingClassOrigem } = trpc.frete.getClassificacoes.useQuery(
    { uf: ufOrigem },
    { enabled: !!ufOrigem }
  );
  const { data: classificacoesDestino, isLoading: isLoadingClassDestino } = trpc.frete.getClassificacoes.useQuery(
    { uf: ufDestino },
    { enabled: !!ufDestino }
  );

  const calcularMutation = trpc.frete.calcular.useMutation({
    onSuccess: (data) => {
      toast.success("Frete calculado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao calcular frete");
    },
  });

  const handleCalcular = () => {
    if (!ufOrigem || !classificacaoOrigem || !ufDestino || !classificacaoDestino || !peso || !valorMercadoria) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const pesoNum = parseFloat(peso);
    const valorNum = parseFloat(valorMercadoria);

    if (isNaN(pesoNum) || pesoNum <= 0) {
      toast.error("Peso inválido");
      return;
    }

    if (isNaN(valorNum) || valorNum < 0) {
      toast.error("Valor da mercadoria inválido");
      return;
    }

    calcularMutation.mutate({
      ufOrigem,
      classificacaoOrigem,
      ufDestino,
      classificacaoDestino,
      peso: pesoNum,
      valorMercadoria: valorNum,
      produtoQuimico,
      aplicarTDE,
    });
  };

  useEffect(() => {
    setClassificacaoOrigem("");
  }, [ufOrigem]);

  useEffect(() => {
    setClassificacaoDestino("");
  }, [ufDestino]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{APP_TITLE}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Calcule o valor do frete de forma rápida e precisa
            </p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                Dados da Remessa
              </CardTitle>
              <CardDescription>Preencha os dados para calcular o frete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Origem */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Origem
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufOrigem">UF de Origem</Label>
                    <Select value={ufOrigem} onValueChange={setUfOrigem}>
                      <SelectTrigger id="ufOrigem">
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingUFs && (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        )}
                        {ufs?.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classificacaoOrigem">Classificação</Label>
                    <Select
                      value={classificacaoOrigem}
                      onValueChange={setClassificacaoOrigem}
                      disabled={!ufOrigem}
                    >
                      <SelectTrigger id="classificacaoOrigem">
                        <SelectValue placeholder="Selecione a classificação" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClassOrigem && (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        )}
                        {classificacoesOrigem?.map((classificacao) => (
                          <SelectItem key={classificacao} value={classificacao}>
                            {classificacao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Destino */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Destino
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufDestino">UF de Destino</Label>
                    <Select value={ufDestino} onValueChange={setUfDestino}>
                      <SelectTrigger id="ufDestino">
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingUFs && (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        )}
                        {ufs?.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classificacaoDestino">Classificação</Label>
                    <Select
                      value={classificacaoDestino}
                      onValueChange={setClassificacaoDestino}
                      disabled={!ufDestino}
                    >
                      <SelectTrigger id="classificacaoDestino">
                        <SelectValue placeholder="Selecione a classificação" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClassDestino && (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        )}
                        {classificacoesDestino?.map((classificacao) => (
                          <SelectItem key={classificacao} value={classificacao}>
                            {classificacao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dados da Mercadoria */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
                  <Package className="h-5 w-5 text-blue-600" />
                  Dados da Mercadoria
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peso" className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Peso (kg)
                    </Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorMercadoria" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor da Mercadoria (R$)
                    </Label>
                    <Input
                      id="valorMercadoria"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={valorMercadoria}
                      onChange={(e) => setValorMercadoria(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="produtoQuimico"
                      checked={produtoQuimico}
                      onCheckedChange={(checked) => setProdutoQuimico(checked as boolean)}
                    />
                    <Label htmlFor="produtoQuimico" className="cursor-pointer">
                      Produto Químico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aplicarTDE"
                      checked={aplicarTDE}
                      onCheckedChange={(checked) => setAplicarTDE(checked as boolean)}
                    />
                    <Label htmlFor="aplicarTDE" className="cursor-pointer">
                      Aplicar TDE (Taxa de Dificuldade de Entrega)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Botão Calcular */}
              <Button
                onClick={handleCalcular}
                disabled={calcularMutation.isPending}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {calcularMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  "Calcular Frete"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado */}
          {calcularMutation.data && (
            <Card className="mt-6 shadow-xl border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950">
                <CardTitle className="text-2xl">Resultado do Cálculo</CardTitle>
                <CardDescription>Detalhamento dos valores do frete</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600 dark:text-gray-300">Frete Peso:</span>
                    <span className="font-semibold text-lg">
                      R$ {calcularMutation.data.fretePeso.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600 dark:text-gray-300">Frete Valor (Ad Valorem):</span>
                    <span className="font-semibold text-lg">
                      R$ {calcularMutation.data.freteValor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600 dark:text-gray-300">Despacho:</span>
                    <span className="font-semibold text-lg">
                      R$ {calcularMutation.data.despacho.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600 dark:text-gray-300">Pedágio:</span>
                    <span className="font-semibold text-lg">
                      R$ {calcularMutation.data.pedagio.toFixed(2)}
                    </span>
                  </div>
                  {produtoQuimico && calcularMutation.data.produtoQuimico > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 dark:text-gray-300">Produto Químico:</span>
                      <span className="font-semibold text-lg">
                        R$ {calcularMutation.data.produtoQuimico.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {calcularMutation.data.tde1 > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 dark:text-gray-300">TDE 1:</span>
                      <span className="font-semibold text-lg">
                        R$ {calcularMutation.data.tde1.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {calcularMutation.data.tde2 > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 dark:text-gray-300">TDE 2:</span>
                      <span className="font-semibold text-lg">
                        R$ {calcularMutation.data.tde2.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-4 border-t-2 border-blue-300 dark:border-blue-700 mt-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Total:</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      R$ {calcularMutation.data.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
