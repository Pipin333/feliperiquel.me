import { navigate, transitionEnabledOnThisPage } from 'astro:transitions/client';
import renderMathInElement from 'katex/contrib/auto-render';
import {
  type EstudiaRoute,
  isSameEstudiaRoute,
  resolveEstudiaHash,
  routeForView
} from './estudia-router';
import {
  type BstNode,
  type DijkstraStep,
  escapeHtml,
  renderBstSvg,
  renderDijkstraTrace,
  renderLcsDpTable
} from './estudia-visuals';
import {
  type CourseId,
  clearMistakes,
  loadMistakes,
  recordMistake,
  resolveMistake
} from './estudia-storage';

type DeleteMode = 'f3' | 'f4';
type QuizMode = 'normal' | 'mistakes';

interface BstDeleteState {
  found: boolean;
  note: string;
  replacementVal: number | null;
}

interface BstStats {
  peso: number;
  alturaNiveles: number;
  alturaAristas: number;
  hojas: number[];
  interiores: number[];
  grado1: number[];
  grado2: number[];
  pre: number[];
  ino: number[];
  post: number[];
  niveles: number[];
}

interface GraphPreset {
  start: number;
  matrix: string;
}

interface RawQuizItem {
  unit?: string;
  tag: string;
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

interface QuizItem extends RawQuizItem {
  id: string;
}

interface CourseGradeConfig {
  label: string;
  weights: readonly number[];
}

interface SearchEntry {
  courseBadge: 'AED' | 'ADA' | 'IA';
  courseClass: 'badge-aed' | 'badge-ada' | 'badge-ia';
  tabId: 'tab-aed' | 'tab-ada' | 'tab-ia';
  subId: string;
  section: string;
  title: string;
  bodyText: string;
  normTitle: string;
  normBody: string;
  element: HTMLElement;
}

const COURSE_WEIGHTS: Record<CourseId, CourseGradeConfig> = {
  aed: { label: 'NPE', weights: [0.2, 0.2, 0.2, 0.1, 0.3] },
  ada: { label: 'NPE', weights: [0.3, 0.3, 0.2, 0.2] },
  ia: { label: 'NP', weights: [0.2, 0.3, 0.3, 0.15, 0.05] }
};

const GRAPH_PRESETS: Record<string, GraphPreset> = {
  dirigido: {
    start: 0,
    matrix: '0 4 2 0 0\n0 0 1 5 0\n0 0 0 8 10\n0 0 0 0 2\n0 0 0 0 0'
  },
  regular: {
    start: 0,
    matrix: '0 1 0 0 1\n1 0 1 0 0\n0 1 0 1 0\n0 0 1 0 1\n1 0 0 1 0'
  },
  desconexo: {
    start: 0,
    matrix: '0 1 1 0 0\n1 0 1 0 0\n1 1 0 0 0\n0 0 0 0 1\n0 0 0 1 0'
  }
};

function withBankIds(course: CourseId, items: readonly RawQuizItem[]): readonly QuizItem[] {
  return items.map((item, idx) => ({
    ...item,
    id: `${course}-bank-${idx}`
  }));
}

function hashText(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const BANKS: Record<CourseId, readonly QuizItem[]> = {
  aed: withBankIds('aed', [
    {
      unit: 'u1',
      tag: 'U1 · Punteros C',
      q: 'Si deseas insertar un nodo externo M justo después del segundo nodo (L->sig) sin perder el resto de la lista L, ¿qué secuencia de instrucciones en C es la correcta?',
      opts: [
        'M->sig = L->sig->sig; L->sig->sig = M; M = NULL;',
        'L->sig->sig = M; M->sig = L->sig->sig; M = NULL;',
        'free(M); L->sig = M;',
        'M = L->sig; L->sig->sig = M;'
      ],
      ans: 0,
      exp: 'Primero enlaza M->sig hacia L->sig->sig para no perder la referencia al resto de la lista; recién después redirige L->sig->sig hacia M y limpia M = NULL.'
    },
    {
      unit: 'u1',
      tag: 'U1 · Memoria C',
      q: 'Al eliminar el cuarto nodo de una lista L usando un puntero aux = L->sig->sig->sig, ¿qué ocurre si ejecutas free(aux) ANTES de L->sig->sig->sig = aux->sig?',
      opts: [
        'Pierdes acceso válido a aux->sig (uso de memoria liberada / corrupción del enlace).',
        'La lista queda ordenada automáticamente.',
        'C libera toda la lista excepto la cabeza.',
        'No pasa nada si L es typedef tNodo *Lista.'
      ],
      ans: 0,
      exp: 'Siempre debes guardar y saltar el nodo (L->sig->sig->sig = aux->sig) mientras aux sigue vivo, y solo al final hacer free(aux); aux = NULL;.'
    },
    {
      unit: 'u1',
      tag: 'U1 · malloc',
      q: 'En Control 1, luego de reservar L->sig->sig = malloc(sizeof(tNodo)); y asignar L->sig->sig->info = 15;, ¿qué instrucción falta para cerrar correctamente el final de la lista?',
      opts: [
        'L->sig->sig->sig = NULL;',
        'free(L->sig->sig);',
        'L->sig = NULL;',
        'malloc(L->sig->sig->sig);'
      ],
      ans: 0,
      exp: 'Un nodo recién creado con malloc tiene campos sin inicializar; todo último nodo debe cerrar su campo ->sig en NULL.'
    },
    {
      unit: 'u1',
      tag: 'U1 · Structs C',
      q: 'Dada la definición typedef struct nodo tNodo; typedef tNodo *Lista; con Lista L;, ¿a qué equivale exactamente L->info?',
      opts: [
        '(*L).info (accede al campo info del struct apuntado por L).',
        '&(L.info) (dirección en memoria del arreglo).',
        'L[0].sig (dirección del siguiente nodo).',
        'sizeof(tNodo).'
      ],
      ans: 0,
      exp: 'El operador flecha p->campo es azúcar sintáctico en C para desreferenciar un puntero a struct y leer su campo: (*p).campo.'
    },
    {
      unit: 'u1',
      tag: 'U1 · TDA',
      q: 'En un Tipo de Dato Abstracto (TDA) Lista, ¿qué diferencia a una operación analizadora de una modificadora?',
      opts: [
        'La analizadora consulta información (como largo o buscar) sin alterar los enlaces; la modificadora cambia la estructura o contenido (como insertaInicio o actualizaLista).',
        'La analizadora libera memoria con free y la modificadora solo imprime.',
        'Solo existen en árboles binarios.',
        'La modificadora siempre cuesta O(1) y la analizadora O(n²).'
      ],
      ans: 0,
      exp: 'La separación de operaciones TDA distingue entre consultas de solo lectura y operaciones que mutan los nodos o enlaces.'
    },
    {
      unit: 'u1',
      tag: 'U1 · Pilas y Filas',
      q: '¿Qué principio y algoritmo clásico del curso corresponden a una Pila frente a una Fila?',
      opts: [
        'Pila es LIFO (Profundidad / DFS y recursión); Fila es FIFO (Amplitud / BFS y Recorrido por Niveles).',
        'Pila es FIFO (BFS) y Fila es LIFO (DFS).',
        'Ambas son FIFO, pero la Fila usa punteros.',
        'La Pila ordena de menor a mayor automáticamente.'
      ],
      ans: 0,
      exp: 'En PTEC101, DFS/Profundidad apila nodos (LIFO), mientras que BFS/Amplitud en grafos y Por Niveles en árboles encolan nodos (FIFO).'
    },
    {
      unit: 'u1',
      tag: 'U1 · Arreglos vs Listas',
      q: '¿Cuál es el compromiso real entre un Arreglo estático en C y una Lista Dinámica simple?',
      opts: [
        'El Arreglo permite acceso O(1) por índice pero insertar al inicio cuesta O(n); la Lista inserta al inicio en O(1) pero acceder al k-ésimo nodo cuesta O(n).',
        'La Lista permite acceso O(1) por índice y usa menos bytes por entero.',
        'El Arreglo crece automáticamente con malloc en O(1).',
        'Insertar al inicio en ambos cuesta O(1).'
      ],
      ans: 0,
      exp: 'Los arreglos son contiguos (acceso directo, inserción con desplazamiento); las listas dinámicas son flexibles mediante punteros *sig.'
    },
    {
      unit: 'u1',
      tag: 'U1 · Solemne 1',
      q: 'En Solemne 1, la función algoritmo(Lista L, int a, int b) avanza aux1 a la posición a, aux2 a la posición b y realiza e = aux1->info; aux1->info = aux2->info; aux2->info = e;. ¿Qué hace?',
      opts: [
        'Intercambia los valores info de los nodos en las posiciones a y b (si están en rango válido 1..largo(L)).',
        'Elimina los nodos entre a y b.',
        'Ordena toda la lista de mayor a menor.',
        'Concatena dos listas circulares.'
      ],
      ans: 0,
      exp: 'Mueve dos punteros a posiciones válidas e intercambia el entero almacenado sin cambiar los enlaces ->sig.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Control 2',
      q: 'En la matriz de costos G de un grafo dirigido de n nodos, si un bucle for (i=0; i<n; i++) cuenta a++ cuando G[i][x] != 0 y b++ cuando G[x][i] != 0, ¿qué retorna (a != 0 && b == 0)?',
      opts: [
        'Retorna true si x es un nodo sumidero (tiene grado de entrada > 0 y grado de salida 0).',
        'Retorna true si x es un nodo fuente.',
        'Retorna true si el grafo es conexo.',
        'Retorna true si x posee un lazo G[x][x].'
      ],
      ans: 0,
      exp: 'En PTEC101 (Control 2), G[i][x] != 0 mide arcos entrantes (a = grado entrada) y G[x][i] != 0 mide arcos salientes (b = grado salida). Entrada > 0 y salida == 0 define un sumidero.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Matriz Grafos',
      q: 'En una matriz de adyacencia int **Grafo de n nodos, ¿cómo detectas si un nodo x es fuente y si posee un lazo?',
      opts: [
        'Fuente si toda su columna G[i][x]==0 y su fila tiene algún G[x][i]!=0; lazo si G[x][x] != 0.',
        'Fuente si toda su fila G[x][i]==0; lazo si G[0][n-1] != 0.',
        'Solo en grafos dirigidos completos hay lazos.',
        'Un nodo aislado con grado 0 siempre es fuente.'
      ],
      ans: 0,
      exp: 'Un nodo fuente emite arcos (salida > 0) y no recibe ninguno (entrada == 0). Un lazo es un arco sobre la diagonal G[x][x] != 0.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Solemne 2 (Camino)',
      q: 'Si Profundidad(w) ejecuta DFS desde w marcando el arreglo global Visitados[], ¿qué hace exactamente la función Profundidad(w); return Visitados[z];?',
      opts: [
        'Retorna true si existe un camino desde w hasta z en el Grafo, y false en caso contrario.',
        'Retorna true si z es adyacente directo de w (en 1 salto).',
        'Retorna el costo mínimo del camino según Dijkstra.',
        'Retorna true si el grafo es k-regular.'
      ],
      ans: 0,
      exp: 'DFS desde w visita exactamente todos los vértices alcanzables desde w; luego consultar Visitados[z] responde si existe al menos un camino entre w y z.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Solemne 2 (Desconexo)',
      q: 'Sobre un grafo no dirigido, ejecutas Profundidad(0); y luego un bucle que retorna true apenas encuentra Visitados[i] == false (y false al terminar). ¿Qué retorna la función?',
      opts: [
        'Retorna true si el grafo es desconexo, y false si es conexo.',
        'Retorna true si el grafo es conexo.',
        'Retorna la cantidad de arcos.',
        'Retorna true si el nodo 0 es sumidero.'
      ],
      ans: 0,
      exp: 'Si tras recorrer todo lo alcanzable desde el nodo 0 queda al menos un nodo con Visitados[i] == false, el grafo está partido en componentes (desconexo).'
    },
    {
      unit: 'u2',
      tag: 'U2 · Solemne 2 (Comp.)',
      q: 'En un grafo no dirigido de n nodos, un bucle for(i=0; i<n; i++) que al hallar !Visitados[i] llama Profundidad(i); y hace cont++; devuelve cont. ¿Qué calcula?',
      opts: [
        'Retorna la cantidad de componentes conexas del grafo.',
        'Retorna el grado del nodo con más arcos.',
        'Retorna la altura del árbol DFS.',
        'Retorna la suma de pesos del grafo.'
      ],
      ans: 0,
      exp: 'Cada llamada inicial a Profundidad(i) desde un nodo aún no visitado descubre una componente conexa completa e incrementa el contador.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Solemne 2 (Regular)',
      q: 'En la matriz de adyacencia (0/1) de un grafo no dirigido de n nodos, ¿qué verifica una función que suma los elementos de cada fila i y retorna false si alguna suma != a?',
      opts: [
        'Retorna true si el grafo es a-regular (todos sus vértices tienen grado a).',
        'Retorna true si el grafo tiene exactamente a arcos totales.',
        'Retorna true si el grafo es completo.',
        'Retorna true si el nodo a es sumidero.'
      ],
      ans: 0,
      exp: 'Sumar la fila i calcula el grado del vértice i; exigir que todos los nodos tengan grado a equivale a definir un grafo a-regular.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Solemne 2 (Camino A)',
      q: 'Dado un arreglo A de largo p con índices de nodos, el bucle for(i=0; i<p-1; i++) verifica if (Grafo[A[i]][A[i+1]] == 0) return false; y al final return true;. ¿Qué evalúa?',
      opts: [
        'Retorna true si la secuencia en A corresponde a un camino válido de largo p (p nodos) en el grafo.',
        'Retorna true si A contiene todos los nodos del grafo.',
        'Retorna true si A está ordenado de menor a mayor.',
        'Retorna el costo total del recorrido.'
      ],
      ans: 0,
      exp: 'Comprueba par a par que exista un arco dirigido desde A[i] hacia A[i+1] para toda la secuencia.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Dijkstra',
      q: 'En la implementación de Dijkstra de PTEC101 (#define infinito 10000000), ¿qué representan los tres vectores auxiliares Costo[], predecesor[] y Visitados[]?',
      opts: [
        'Costo[] guarda la menor distancia hallada, predecesor[] permite reconstruir el camino mínimo y Visitados[] marca los nodos ya fijados (asumiendo pesos >= 0).',
        'Costo[] guarda pesos negativos, Visitados[] es una Cola FIFO y predecesor[] es una Pila.',
        'Solo sirven para grafos sin pesos en árboles AB.',
        'Costo[] almacena el grado de entrada de cada vértice.'
      ],
      ans: 0,
      exp: 'Dijkstra selecciona iterativamente el nodo u no visitado con menor Costo[u], lo fija en Visitados[] y relaja a sus vecinos actualizando Costo[] y predecesor[].'
    },
    {
      unit: 'u3',
      tag: 'U3 · Conceptos AB',
      q: 'Según la convención de Control 3 en PTEC101, ¿qué definen Peso y Nodo Hoja en un Árbol Binario (AB)?',
      opts: [
        'Peso es la cantidad total de nodos del árbol; hoja es todo nodo con izq == NULL && der == NULL.',
        'Peso es la suma de los valores ->info; hoja es un nodo de grado 1.',
        'Peso es el número de niveles; hoja es la raíz.',
        'Peso es el doble de la altura.'
      ],
      ans: 0,
      exp: 'En Control 3, Peso = número total de nodos, Altura = niveles máximos, Hojas = nodos sin hijos y Nodos interiores = los que no son hojas.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Recursión AB (Act.10)',
      q: 'Si un algoritmo recursivo sobre un AB recorre ambos subárboles (T->izq y T->der) y se detiene únicamente en if (T == NULL) return ..., ¿cuántas veces se ejecuta en un árbol de n = 11 nodos?',
      opts: [
        '23 veces (siempre 2n + 1 llamadas en total).',
        '11 veces (una por nodo).',
        '22 veces (2n llamadas).',
        '12 veces (n + 1 llamadas).'
      ],
      ans: 0,
      exp: 'Cada uno de los n nodos posee 2 punteros hijos (2n invocaciones desde nodos) más la llamada inicial sobre la raíz: n + (n + 1) = 2n + 1 = 23.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Recorridos AB',
      q: '¿Qué orden de visita sigue PostOrden en un AB y qué estructura auxiliar necesita el Recorrido por Niveles?',
      opts: [
        'PostOrden visita Izquierdo -> Derecho -> Papá; Por Niveles utiliza una Fila (FIFO).',
        'PostOrden visita Papá -> Izquierdo -> Derecho; Por Niveles utiliza una Pila (LIFO).',
        'InOrden entrega valores al revés en un ABO; Por Niveles usa recursión simple sin memoria.',
        'PreOrden visita Izquierdo -> Derecho -> Papá.'
      ],
      ans: 0,
      exp: 'PostOrden procesa primero ambos subárboles y al final la raíz (papá); el recorrido por niveles encola los hijos en una Fila FIFO.'
    },
    {
      unit: 'u3',
      tag: 'U3 · ALG1 (Act.10)',
      q: 'En Actividad 10, if (T->izq != NULL && T->der != NULL) return 1 + ALG1(T->izq) + ALG1(T->der); else return ALG1(T->izq) + ALG1(T->der); retorna:',
      opts: [
        'La cantidad de nodos de grado 2 que posee el árbol binario T.',
        'La altura del árbol T.',
        'La cantidad de nodos hoja de T.',
        'El peso total (cantidad de nodos) de T.'
      ],
      ans: 0,
      exp: 'Solo suma 1 cuando el nodo actual tiene ambos subárboles no nulos (grado 2).'
    },
    {
      unit: 'u3',
      tag: 'U3 · ALG3 (Act.10)',
      q: 'La función ALG3(AB T, int x) devuelve 0 si T->info == x; si no, consulta si x está en T->der para devolver 1 + ALG3(T->der, x) o 1 + ALG3(T->izq, x). ¿Qué retorna?',
      opts: [
        'El nivel del nodo x dentro del árbol binario T (con la raíz en nivel 0).',
        'La cantidad de descendientes del nodo x.',
        'El menor elemento del árbol T.',
        'La cantidad de nodos de grado 1.'
      ],
      ans: 0,
      exp: 'Suma 1 por cada arista recorrida al bajar desde la raíz hasta encontrar T->info == x (caso base 0).'
    },
    {
      unit: 'u3',
      tag: 'U3 · Solemne 3',
      q: 'En un ABO con raíz 40, hijo izquierdo 10 e hijo derecho 60, si insertas en ese orden los valores 50, 55, 53 y 45, ¿cuál es el recorrido por niveles resultante?',
      opts: [
        '40 10 60 50 45 55 53.',
        '40 10 60 45 50 53 55.',
        '10 40 45 50 53 55 60.',
        '40 10 60 50 55 53 45.'
      ],
      ans: 0,
      exp: 'Nivel 0: 40; Nivel 1: 10, 60; Nivel 2: 50 (izq de 60); Nivel 3: 45 (izq de 50), 55 (der de 50); Nivel 4: 53 (izq de 55).'
    },
    {
      unit: 'u3',
      tag: 'U3 · Eliminación ABO',
      q: 'De las 4 formas de eliminar un nodo con dos hijos en un ABO, ¿por qué en Solemne 3 se prefieren las Formas 3 y 4 por sobre las Formas 1 y 2?',
      opts: [
        'Porque las Formas 1 y 2 cuelgan un subárbol completo debajo de una hoja del otro lado, dejando el ABO muy desbalanceado.',
        'Porque las Formas 1 y 2 pierden nodos y rompen el orden de InOrden.',
        'Porque las Formas 3 y 4 no requieren liberar memoria.',
        'Porque Forma 1 solo funciona en grafos.'
      ],
      ans: 0,
      exp: 'Las Formas 3 y 4 solo reemplazan el valor de la raíz por un sucesor o predecesor cercano y eliminan un nodo de a lo más 1 hijo, preservando mejor el balance.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Forma 3 vs Forma 4',
      q: 'Al eliminar un nodo con 2 hijos en un ABO usando Forma 3 ("menor de los mayores") frente a Forma 4 ("mayor de los menores"), ¿cuál es la diferencia exacta?',
      opts: [
        'Forma 3 reemplaza por Menor(A->der); Forma 4 reemplaza por Mayor(A->izq).',
        'Forma 3 reemplaza por Mayor(A->izq); Forma 4 reemplaza por Menor(A->der).',
        'Forma 3 siempre sube el subárbol izquierdo entero.',
        'Ambas eligen la hoja de menor profundidad sin revisar valores.'
      ],
      ans: 0,
      exp: 'Menor(A->der) baja siempre por ->izq en el subárbol derecho; Mayor(A->izq) baja siempre por ->der en el subárbol izquierdo.'
    }
  ]),
  ada: withBankIds('ada', [
    {
      unit: 'u1',
      tag: 'U1 · Ordenamiento',
      q: '¿Cuál es la complejidad en el peor caso de Quicksort y por qué ocurre?',
      opts: [
        'O(n²), cuando el pivote siempre es un extremo.',
        'O(n log n) siempre.',
        'O(n), en arreglos ordenados.',
        'O(log n).'
      ],
      ans: 0,
      exp: 'Particiones totalmente desbalanceadas (0 y n-1 elementos) generan altura n y costo cuadrático.'
    },
    {
      unit: 'u1',
      tag: 'U1 · T. Sustracción',
      q: 'En el Teorema Maestro por Sustracción T(n) = a·T(n - b) + O(n^k) con a > 1, ¿cuál es su complejidad asintótica?',
      opts: [
        'O(a^(n/b) · n^k) (exponencial).',
        'O(n^(k+1)).',
        'O(n^k).',
        'O(n log n).'
      ],
      ans: 0,
      exp: 'Cuando a > 1 en sustracción, el número de llamadas crece exponencialmente en n/b: Caso 3 da O(a^(n/b) · n^k).'
    },
    {
      unit: 'u1',
      tag: 'U1 · Invariantes',
      q: '¿Cuáles son los tres pasos obligatorios para demostrar la correctitud de un bucle mediante un invariante?',
      opts: [
        'Inicialización, Mantención y Terminación.',
        'Inducción, Caso Base y Poda.',
        'División, Conquista y Combinación.',
        'Verificación, Reducción y Certificación.'
      ],
      ans: 0,
      exp: 'Se prueba que vale antes de partir (Inicialización), se preserva en cada iteración (Mantención) y garantiza el resultado al salir (Terminación).'
    },
    {
      unit: 'u1',
      tag: 'U1 · Heaps',
      q: '¿Cuánto cuesta construir un Heap binario (Build-Heap) desde un arreglo desordenado de n elementos?',
      opts: ['O(n).', 'O(n log n).', 'O(log n).', 'O(n²).'],
      ans: 0,
      exp: 'Build-Heap de abajo hacia arriba toma O(n) porque la mayoría de los nodos bajan muy pocos niveles.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Divide y Vencerás',
      q: '¿Cuál es la complejidad de encontrar el k-ésimo elemento usando Mediana de Medianas?',
      opts: [
        'O(n) garantizado en el peor caso.',
        'O(n log n) siempre.',
        'O(n²) en el peor caso.',
        'O(log n).'
      ],
      ans: 0,
      exp: 'La recurrencia T(n) = T(n/5) + T(7n/10) + O(n) suma 9/10 < 1, garantizando O(n) en el peor caso.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Grafos',
      q: '¿Cuándo falla Dijkstra y qué algoritmo lo reemplaza para un origen único?',
      opts: [
        'Falla con pesos negativos; se usa Bellman-Ford.',
        'Falla en grafos no dirigidos; se usa Kruskal.',
        'Falla con ciclos positivos; se usa BFS.',
        'Nunca falla.'
      ],
      ans: 0,
      exp: 'Dijkstra asume pesos ≥ 0; Bellman-Ford soporta aristas negativas y detecta ciclos negativos en O(VE).'
    },
    {
      unit: 'u2',
      tag: 'U2 · Grafos',
      q: 'En un grafo NO dirigido, ¿qué tipos de aristas produce un recorrido DFS y cuándo existe un ciclo?',
      opts: [
        'Solo aristas de Árbol (Tree) y Retroceso (Back); hay ciclo si existe al menos una arista Back.',
        'Produce Tree, Back, Forward y Cross.',
        'Solo aristas Forward y Cross.',
        'Hay ciclo solo si hay una arista Cross.'
      ],
      ans: 0,
      exp: 'En grafos no dirigidos DFS nunca genera aristas Forward ni Cross; cualquier arista Back revela un ciclo.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Grafos',
      q: '¿Qué problema resuelve Floyd-Warshall y cuál es su complejidad temporal?',
      opts: [
        'Caminos mínimos entre todos los pares de vértices en O(V³).',
        'Árbol de expansión mínima en O(E log V).',
        'Caminos mínimos desde un origen sin pesos en O(V+E).',
        'Ordenamiento topológico en O(V²).'
      ],
      ans: 0,
      exp: 'Floyd-Warshall usa Programación Dinámica probando vértices intermedios k en triple bucle: O(V³).'
    },
    {
      unit: 'u2',
      tag: 'U2 · MST',
      q: '¿Qué estrategia siguen Kruskal y Prim para hallar el Árbol de Expansión Mínima?',
      opts: [
        'Greedy (Voraz): eligen la arista segura mínima sin formar ciclos.',
        'Programación Dinámica.',
        'Backtracking con poda.',
        'Divide y Vencerás.'
      ],
      ans: 0,
      exp: 'Ambos explotan la propiedad del corte seleccionando la arista de menor peso que conecta componentes sin crear ciclos.'
    },
    {
      unit: 'u2',
      tag: 'U2 · PD',
      q: '¿Qué dos propiedades requiere un problema para resolverse con Programación Dinámica?',
      opts: [
        'Subestructura óptima y subproblemas superpuestos.',
        'Propiedad voraz y pesos positivos.',
        'Estar en P y tener certificado.',
        'Heurística admisible y cola FIFO.'
      ],
      ans: 0,
      exp: 'La superposición de subproblemas hace rentable memorizar resultados en una tabla DP.'
    },
    {
      unit: 'u2',
      tag: 'U2 · PD Knapsack',
      q: '¿Por qué O(nW) en Mochila 0-1 es pseudo-polinomial?',
      opts: [
        'Porque es exponencial respecto a los log₂(W) bits necesarios para escribir W.',
        'Porque solo funciona con W primo.',
        'Porque siempre es O(n).',
        'Porque usa Greedy.'
      ],
      ans: 0,
      exp: 'El tamaño de entrada de W es log₂(W) bits, no el valor numérico W.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Greedy',
      q: 'En Activity Selection, ¿por qué criterio ordenas para maximizar actividades compatibles?',
      opts: [
        'Menor tiempo de finalización.',
        'Menor tiempo de inicio.',
        'Menor duración.',
        'Mayor duración.'
      ],
      ans: 0,
      exp: 'Terminar lo antes posible deja máximo espacio disponible para las siguientes actividades.'
    },
    {
      unit: 'u2',
      tag: 'U2 · Backtracking',
      q: '¿Las podas en Backtracking o Branch & Bound reducen la complejidad asintótica del peor caso?',
      opts: [
        'No, el peor caso sigue siendo exponencial (ej. O(2^n) o O(n!)).',
        'Sí, la bajan a O(n log n).',
        'Sí, la vuelven polinomial.',
        'Solo si hay pesos positivos.'
      ],
      ans: 0,
      exp: 'Mejoran mucho en la práctica, pero no cambian la cota exponencial teórica del peor caso.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Paralelismo',
      q: 'Según la Ley de Amdahl, si la fracción estrictamente secuencial de un programa es f = 0.25, ¿cuál es la aceleración máxima teórica aunque uses infinitos procesadores?',
      opts: [
        'S_p ≤ 1 / 0.25 = 4x.',
        'S_p ≤ 0.25x.',
        'Infinita al aumentar p.',
        'S_p ≤ 2x.'
      ],
      ans: 0,
      exp: 'La parte secuencial f nunca se paraleliza: S_p ≤ 1 / (f + (1-f)/p) ≤ 1/f.'
    },
    {
      unit: 'u3',
      tag: 'U3 · PRAM y Bernstein',
      q: 'En un modelo PRAM, ¿qué significa CREW y qué exige la condición de Bernstein para ejecutar dos tareas en paralelo?',
      opts: [
        'Lectura Concurrente y Escritura Exclusiva; que sus conjuntos de escritura no se intersequen con lectura/escritura de la otra.',
        'Lectura Exclusiva y Escritura Concurrente.',
        'Memoria distribuida por mensajes MPI.',
        'Solo permite 2 hilos.'
      ],
      ans: 0,
      exp: 'CREW = Concurrent Read, Exclusive Write; Bernstein exige que las salidas O_1 y O_2 no colisionen entre sí ni con las entradas del otro.'
    },
    {
      unit: 'u3',
      tag: 'U3 · P vs NP',
      q: 'Para probar que un problema NUEVO es NP-Duro, ¿en qué dirección va la reducción polinomial?',
      opts: [
        '[NPC Conocido] ≤ₚ [Nuevo].',
        '[Nuevo] ≤ₚ [NPC Conocido].',
        '[Nuevo] ≤ₚ [P Conocido].',
        'Cualquier dirección.'
      ],
      ans: 0,
      exp: 'Debes transformar cualquier instancia del NPC conocido en una instancia del problema Nuevo.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Reducciones NPC',
      q: 'Si un problema X es NP-Completo y demuestras que X ≤ₚ A, ¿qué acabas de probar sobre A?',
      opts: [
        'Que A es NP-Duro (para ser NP-Completo falta probar además que A está en NP).',
        'Que A es NP-Completo automáticamente.',
        'Que A está en P.',
        'Que P = NP.'
      ],
      ans: 0,
      exp: 'Reducir desde un NPC prueba dureza (NP-Duro). Para ser NP-Completo requiere también verificador polinomial (A ∈ NP).'
    },
    {
      unit: 'u3',
      tag: 'U3 · Clásicos NPC',
      q: "¿Qué relación existe entre un Vertex Cover V' y su complemento V \\ V' en un grafo G?",
      opts: [
        "V' es un Vertex Cover si y solo si V \\ V' es un Independent Set.",
        "V' es un Clique en G.",
        "V' es un árbol de expansión mínima.",
        "V \\ V' es un ciclo hamiltoniano."
      ],
      ans: 0,
      exp: "Si V' cubre todas las aristas, ninguna arista tiene ambos extremos en V \\ V', por lo que V \\ V' es un conjunto independiente."
    }
  ]),
  ia: withBankIds('ia', [
    {
      unit: 'u12',
      tag: 'U1-U2 · Búsqueda Clásica',
      q: '¿Qué componentes forman un nodo de búsqueda según la formulación clásica del curso?',
      opts: [
        'Estado, padre, operador aplicado, profundidad y costo acumulado g(n).',
        'Solo el estado y la heurística h(n).',
        'Población, tasa de mutación y fitness.',
        'Precondiciones, efectos y fluyentes.'
      ],
      ans: 0,
      exp: 'Un nodo completo guarda n = <estado, padre, operador, profundidad, g(n)> para poder reconstruir el camino y ordenar la frontera.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · BFS vs UCS',
      q: 'Si las aristas de un grafo tienen costos positivos distintos (por ej. 1, 2, 5), ¿cuál algoritmo garantiza el camino más barato?',
      opts: [
        'UCS (Costo Uniforme), porque minimiza el costo acumulado g(n) y no la cantidad de aristas.',
        'BFS, porque siempre encuentra el camino óptimo aunque haya pesos.',
        'DFS, porque explora primero el menor índice.',
        'Greedy, porque solo mira el costo del último paso.'
      ],
      ans: 0,
      exp: 'BFS minimiza profundidad (cantidad de pasos), lo que solo coincide con costo mínimo cuando todos los pasos cuestan igual.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Memoria',
      q: 'Entre BFS, DFS y UCS, ¿cuál es la elección razonable cuando la memoria es la restricción principal y no se exige optimalidad?',
      opts: [
        'DFS, porque solo almacena la rama actual en una pila.',
        'BFS, porque guarda todos los niveles en cola.',
        'UCS, porque mantiene toda la frontera ordenada por costo.',
        'A*, porque guarda g(n) y h(n).'
      ],
      ans: 0,
      exp: 'DFS requiere espacio lineal respecto a la profundidad en lugar de exponencial como BFS.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · A* Admisibilidad',
      q: '¿Qué condición debe cumplir h(n) para que A* sea óptimo y qué pasa si h(n) = 0 en todos los nodos?',
      opts: [
        'Debe ser admisible (h(n) ≤ h*(n)); si h(n)=0 siempre, A* se comporta como UCS.',
        'Debe sobreestimar el costo real; si h(n)=0 se comporta como DFS.',
        'Debe ser mayor que g(n); si h(n)=0 falla.',
        'Debe usar pila LIFO.'
      ],
      ans: 0,
      exp: 'Si h(n)=0 para todo n, f(n) = g(n) + 0 = g(n), que es exactamente UCS.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · A* Consistencia',
      q: 'Para la arista A -> B de costo c(A,B) = 1, si h(A) = 4 y h(B) = 1, ¿es consistente h en esa arista?',
      opts: [
        'No, porque 4 <= 1 + 1 (4 <= 2) es falso.',
        'Sí, porque h(A) > h(B).',
        'Sí, porque la arista cuesta 1.',
        'No se puede saber sin h*(B).'
      ],
      ans: 0,
      exp: 'La consistencia exige h(A) ≤ c(A,B) + h(B). Aquí 4 ≤ 1 + 1 es falso, luego no es consistente.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Distancias Grilla',
      q: 'En una grilla donde se permiten movimientos ortogonales Y diagonales con costo 1, ¿qué heurística es exacta y admisible desde (1,2) hasta (6,7)?',
      opts: [
        'Chebyshev = max(5, 5) = 5 (Manhattan=10 y Euclidiana≈7.07 sobreestiman).',
        'Manhattan = 5 + 5 = 10.',
        'Euclidiana = √50 ≈ 7.07.',
        'Ninguna, hay que usar 0.'
      ],
      ans: 0,
      exp: 'Con diagonales de costo 1 solo se necesitan 5 pasos diagonales. Manhattan (10) y Euclidiana (7.07) superan 5 y dejan de ser admisibles.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Poda Alfa-Beta',
      q: 'En Minimax con poda Alfa-Beta, ¿cuándo se poda y cambia la decisión de la raíz respecto a Minimax completo?',
      opts: [
        'Se poda cuando α ≥ β y NUNCA cambia la decisión final de Minimax.',
        'Se poda cuando α < β y puede cambiar el óptimo.',
        'Se poda en todo nodo hoja.',
        'Se poda solo cuando β = +∞.'
      ],
      ans: 0,
      exp: 'La poda Alfa-Beta descarta ramas que el oponente racional jamás permitirá alcanzar, preservando exactamente el valor de Minimax.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Anytime',
      q: 'En una búsqueda Anytime en juegos con límite de tiempo, si se interrumpe en medio de la profundidad d=3, ¿qué acción devuelve?',
      opts: [
        'La mejor acción de la última profundidad completada por completo (d=2).',
        'El primer hijo que iba ganando en d=3.',
        'Un nodo elegido al azar.',
        'Devuelve error por tiempo agotado.'
      ],
      ans: 0,
      exp: 'Un resultado parcial de d=3 evalúa ramas de forma desigual y no puede reemplazar la última iteración completa.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · CSP',
      q: 'Para el CSP con variables {A,B,C,D}, dominio {1,2,3} y restricciones A!=B, A!=C, B!=D, C<D, ¿qué es la asignación {A=1, B=2, C=3, D=2}?',
      opts: [
        'Completa e inconsistente (asigna todas las variables, pero viola B!=D y C<D).',
        'Completa y consistente (es solución).',
        'Parcial y consistente.',
        'Parcial e inconsistente.'
      ],
      ans: 0,
      exp: 'Asigna las 4 variables (completa), pero 2 != 2 es falso y 3 < 2 es falso (inconsistente).'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Hill Climbing',
      q: 'En Ascenso de Colinas estándar (minimización), si estás en C con f(C)=8 y el mejor vecino D también tiene f(D)=8, ¿qué hace el algoritmo?',
      opts: [
        'Se detiene y devuelve C porque no existe mejora estricta; permitir movimientos laterales exige controlar ciclos.',
        'Se mueve a D infinitamente.',
        'Acepta D con probabilidad e^(-0/T).',
        'Retrocede al estado inicial.'
      ],
      ans: 0,
      exp: 'Hill Climbing estándar detiene la búsqueda cuando f(mejor) >= f(actual); en mesetas necesita límite de movimientos laterales para evitar ciclos.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Tabú y Permutaciones',
      q: '¿Qué ocurre con un movimiento que está en la lista tabú pero logra f=7, superando al mejor global histórico f*=8 (minimización)?',
      opts: [
        'Es admisible por criterio de aspiración y se selecciona si tiene el mejor f.',
        'Queda prohibido sin excepciones hasta que expire el tenure.',
        'Se penaliza con infinito.',
        'Solo aplica en algoritmos genéticos.'
      ],
      ans: 0,
      exp: 'El criterio de aspiración permite aceptar un movimiento tabú cuando mejora estrictamente el mejor valor global conocido.'
    },
    {
      unit: 'u12',
      tag: 'U1-U2 · Genéticos y ACO',
      q: 'Si aplicas cruzamiento de 1 punto directo sobre dos permutaciones del TSP [2,4,6,1,3,5] y [3,1,5,2,6,4], ¿por qué falla y cómo se corrige?',
      opts: [
        'Falla porque repite ciudades y omite otras; se usa cruzamiento ordenado copiando un segmento y rellenando el resto en orden desde el otro padre.',
        'Falla porque cambia el tamaño del vector; se corrige sumando los valores.',
        'No falla nunca en permutaciones.',
        'En Bin Packing devuelve fitness 0.'
      ],
      ans: 0,
      exp: 'Un corte directo rompe la unicidad de las permutaciones. Se requiere cruzamiento ordenado (OX) y mutación por intercambio (swap).'
    },
    {
      unit: 'u3',
      tag: 'U3 · Agente Lógico',
      q: '¿Cuál es la diferencia entre las operaciones TELL y ASK en un agente basado en conocimiento?',
      opts: [
        'TELL incorpora nuevas sentencias a la Base de Conocimiento (BC) y ASK consulta qué se puede derivar o decidir.',
        'ASK modifica la BC y TELL calcula la entropía.',
        'Ambas ejecutan algoritmos genéticos.',
        'TELL solo borra hechos y ASK solo inserta hechos.'
      ],
      ans: 0,
      exp: 'El ciclo lógico usa TELL para registrar percepciones/acciones en la BC y ASK para consultar conclusiones lógicas.'
    },
    {
      unit: 'u3',
      tag: 'U3 · FNC y Resolución',
      q: '¿En qué consiste la Forma Normal Conjuntiva (FNC) y sobre qué opera la regla de resolución?',
      opts: [
        'FNC es una conjunción de cláusulas (disyunciones de literales); la resolución elimina literales complementarios p y ¬p.',
        'FNC solo usa implicaciones; la resolución calcula tablas de verdad completas.',
        'FNC es exclusiva de PDDL.',
        'La resolución multiplica probabilidades condicionales.'
      ],
      ans: 0,
      exp: 'Transformar la BC a FNC permite aplicar resolución por refutación eliminando pares complementarios.'
    },
    {
      unit: 'u3',
      tag: 'U3 · LPO',
      q: 'En Lógica de Primer Orden (LPO), ¿qué diferencia a un predicado de una función, y a una sustitución de la unificación?',
      opts: [
        'El predicado evalúa a V/F y la función devuelve un objeto; la sustitución aplica un reemplazo dado y la unificación busca igualar dos expresiones.',
        'La función evalúa a V/F y el predicado devuelve un número.',
        'No hay diferencia en LPO.',
        'La unificación solo existe en Python.'
      ],
      ans: 0,
      exp: 'padre(luke) puede ser una función (devuelve un individuo); es_jedi(luke) es un predicado (verdadero o falso).'
    },
    {
      unit: 'u3',
      tag: 'U3 · Prolog (S2)',
      q: 'Con el hecho dirigido colaboracion(maria, nicolas). y la regla son_colaboradores(X,Y) :- colaboracion(X,Y); colaboracion(Y,X)., ¿qué responde Prolog a ?- colaboracion(nicolas, maria).?',
      opts: [
        'false (el hecho base es dirigido y no está registrado al revés).',
        'true (la regla hace simétrico el hecho base).',
        'X = maria.',
        'Error de sintaxis.'
      ],
      ans: 0,
      exp: 'La simetría solo existe cuando se consulta el predicado son_colaboradores/2; el hecho colaboracion/2 guarda la dirección original.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Prolog',
      q: 'En la regla companeros_proyecto(X, Y) :- participa(X, P), participa(Y, P), X \\= Y., ¿por qué es necesario X \\= Y?',
      opts: [
        'Para evitar que un investigador sea compañero de proyecto de sí mismo.',
        'Para exigir que estén en proyectos distintos.',
        'Para hacer la regla simétrica.',
        'Para ordenar alfabéticamente la salida.'
      ],
      ans: 0,
      exp: 'Sin X \\= Y, Prolog unificaría X e Y con la misma persona (ej. pilar con pilar) al compartir proyecto.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Planificación',
      q: 'En planificación clásica Π = ⟨F, A, I, G⟩, ¿qué diferencia a la búsqueda por progresión de la regresión y para qué sirve un problema relajado?',
      opts: [
        'Progresión parte desde I hacia G; regresión parte desde G hacia I; el problema relajado sirve para diseñar heurísticas admisibles.',
        'Progresión parte desde G y regresión desde I.',
        'El problema relajado borra la meta G.',
        'Son idénticos a Hill Climbing.'
      ],
      ans: 0,
      exp: 'Relajar un problema (quitando efectos negativos o precondiciones) da una estimación optimista de pasos hacia la meta.'
    },
    {
      unit: 'u3',
      tag: 'U3 · PDDL',
      q: 'En PDDL, ¿qué se define en el archivo de Dominio vs el archivo de Problema?',
      opts: [
        'El Dominio define :types, :predicates y :action; el Problema define :objects, :init y :goal.',
        'El Dominio define :init y :goal; el Problema define :action.',
        'Ambos archivos contienen solo tablas de Bayes.',
        'El Dominio solo define constantes numéricas.'
      ],
      ans: 0,
      exp: 'El dominio modela las reglas generales del mundo (acciones) y el problema instancia un caso particular (objetos, inicio y meta).'
    },
    {
      unit: 'u3',
      tag: 'U3 · Bayes (Virus)',
      q: 'Con prevalencia P(i)=0.001, test con P(+|i)=0.99 y P(+|¬i)=0.02, ¿por qué un único test positivo da ~4.72% y qué se asume al elevar al cuadrado en un segundo test?',
      opts: [
        'Porque los muchos sanos producen más falsos positivos que verdaderos positivos; el segundo test asume independencia condicional dado el estado I.',
        'Porque el test acierta 4.72% en enfermos; no requiere ninguna suposición.',
        'Porque P(i|+) = 1 - P(+|i).',
        'Porque los dos tests son marginalmente independientes.'
      ],
      ans: 0,
      exp: 'Al repetir la prueba, P(t1, t2 | i) = P(t1 | i)·P(t2 | i) solo es válido bajo independencia condicional dada la infección.'
    },
    {
      unit: 'u3',
      tag: 'U3 · Red Bayesiana',
      q: 'En la red S → T ← F y T → D, ¿cómo se calcula P(s, ¬f, t, ¬d)?',
      opts: [
        'P(s) · P(¬f) · P(t | s, ¬f) · P(¬d | t)',
        'P(s) · P(f) · P(t | s, f) · P(d | t)',
        '1 - [P(s) · P(f) · P(t | s, f) · P(d | t)]',
        'P(s | t) · P(¬f | t) · P(t) · P(¬d)'
      ],
      ans: 0,
      exp: 'Cada nodo de la Red Bayesiana se multiplica condicionado únicamente a los valores de sus padres directos.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Data Leakage',
      q: "Para predecir si un equipo fallará ANTES de hacer la revisión técnica, ¿por qué no puedes usar la columna 'Anomalía confirmada en revisión' como atributo de entrada?",
      opts: [
        'Sería fuga de datos (Data Leakage): usarías información futura que no existe al momento de predecir.',
        'Porque solo se aceptan atributos categóricos.',
        'Porque aumenta la entropía a 1.',
        'Porque solo sirve en clustering.'
      ],
      ans: 0,
      exp: 'Usar datos disponibles solo después de la predicción entrega la respuesta al modelo en entrenamiento y falla en producción.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Matriz Confusión',
      q: 'En la Solemne 2 (Venenoso = Positivo, Comestible = Negativo), ¿qué es un Falso Negativo (FN) y por qué es el error más grave?',
      opts: [
        'Un hongo venenoso predicho como comestible; expone a intoxicación o muerte al consumirlo.',
        'Un hongo comestible predicho como venenoso; solo se descarta un hongo bueno.',
        'Un hongo venenoso correctamente detectado.',
        'Un hongo comestible correctamente detectado.'
      ],
      ans: 0,
      exp: '2.ª letra = predicción (Negativo = Comestible); 1.ª letra = Falso (mintió, en realidad era Venenoso).'
    },
    {
      unit: 'u4',
      tag: 'U4 · Desbalance',
      q: 'Si el 99% de los registros son Negativos y el 1% son Positivos, ¿por qué la Exactitud (Accuracy) es engañosa?',
      opts: [
        'Un clasificador trivial que prediga siempre Negativo logra 99% de exactitud con 0% de sensibilidad.',
        'Porque la exactitud es siempre negativa.',
        'Porque no usa VN en su fórmula.',
        'Porque es idéntica a la especificidad.'
      ],
      ans: 0,
      exp: 'Con clases desbalanceadas conviene evaluar Sensibilidad, Precisión o F1-Score.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Métricas (Hongos)',
      q: 'Ante el riesgo de que un hongo venenoso sea clasificado como comestible (FN grave), ¿qué métrica debes priorizar al evaluar el modelo?',
      opts: [
        'Sensibilidad (Recall) = VP / (VP + FN).',
        'Especificidad = VN / (VN + FP).',
        'Exactitud = (VP + VN) / Total.',
        'Entropía H(E).'
      ],
      ans: 0,
      exp: 'La sensibilidad mide exactamente qué porcentaje de los hongos venenosos reales logra detectar el clasificador.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Clustering Min-Max',
      q: "Antes de calcular distancias euclidianas entre 'Distancia (0-10 km)' y 'Duración (0-100 min)', ¿para qué aplicas x' = (x - mín)/(máx - mín)?",
      opts: [
        'Para llevar ambos atributos a [0, 1] y evitar que la variable de mayor escala domine la distancia.',
        'Para convertir el clustering en aprendizaje supervisado.',
        'Para calcular la ganancia de información.',
        'Para eliminar puntos núcleo en DBSCAN.'
      ],
      ans: 0,
      exp: 'Sin normalización, diferencias de 60 minutos aportan 3600 frente a 1 km²=1, aplastando al resto de atributos.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Jerárquico',
      q: 'En clustering jerárquico aglomerativo, ¿qué diferencia al enlace Simple (Single) del Completo (Complete)?',
      opts: [
        'Single usa la distancia mínima entre puntos de ambos grupos; Complete usa la distancia máxima.',
        'Single usa el máximo y Complete el mínimo.',
        'Ambos usan la media de todos los pares.',
        'Single requiere ε y MinPts.'
      ],
      ans: 0,
      exp: 'Single linkage toma min d(a,b) (tiende a cadenas); Complete linkage toma max d(a,b) (grupos compactos).'
    },
    {
      unit: 'u4',
      tag: 'U4 · DBSCAN',
      q: 'En DBSCAN con ε=2 y MinPts=4, un punto Q tiene 2 puntos dentro de radio 2 (incluyéndose), y uno de ellos es Núcleo. ¿Cómo se clasifica Q?',
      opts: [
        'Punto Borde (Border).',
        'Punto Núcleo (Core).',
        'Ruido (Noise).',
        'Hoja pura.'
      ],
      ans: 0,
      exp: 'No cumple MinPts (2 < 4) para ser Núcleo, pero está al alcance (≤ ε) de un Núcleo, así que pertenece al cluster como Borde.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Entropía',
      q: 'Un subgrupo tiene 4 ejemplos Positivos y 4 Negativos. Sin usar calculadora, ¿cuánto vale su entropía H(E)?',
      opts: ['1.000000 bits.', '0.000000 bits.', '0.500000 bits.', '0.811278 bits.'],
      ans: 0,
      exp: 'Mitad y mitad (50% / 50%) representa incertidumbre máxima, por lo que H(E) = 1 bit.'
    },
    {
      unit: 'u4',
      tag: 'U4 · Generalización',
      q: 'Si tu árbol de decisión logra 100% de acierto sobre los 8 hongos de entrenamiento, ¿garantiza que clasificará bien cualquier hongo nuevo?',
      opts: [
        'No, puede sobreajustarse a una muestra reducida; hay que evaluarlo en un conjunto de prueba independiente.',
        'Sí, porque todas las hojas tienen entropía 0.',
        'Sí, siempre que se haya dividido por un atributo numérico.',
        'Solo si H(E_0) = 1.'
      ],
      ans: 0,
      exp: 'Acertar entrenamiento no mide capacidad de generalización sobre ejemplos no vistos.'
    }
  ])
};

const activeQuizMode: Record<CourseId, QuizMode> = {
  aed: 'normal',
  ada: 'normal',
  ia: 'normal'
};

function isCourseId(value: string | undefined): value is CourseId {
  return value === 'aed' || value === 'ada' || value === 'ia';
}

function getScopedEl<T extends HTMLElement>(root: HTMLElement, id: string): T | null {
  return root.querySelector<T>(`#${id}`);
}

/** Renders KaTeX math delimiters strictly within the given container element. */
function renderMath(element: HTMLElement): void {
  renderMathInElement(element, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ],
    throwOnError: false
  });
}

function getCurrentDomRoute(root: HTMLElement): EstudiaRoute {
  const activeTab = root.querySelector<HTMLElement>('.tab-content.active');
  const tabId = activeTab?.id ?? 'tab-home';
  if (tabId === 'tab-home') {
    return routeForView('tab-home');
  }
  const activeSub = activeTab?.querySelector<HTMLElement>('.sub-panel.active');
  return routeForView(tabId, activeSub?.id ?? null);
}

function getPreferredCourseSubId(root: HTMLElement, tabId: string): string | null {
  const tabEl = getScopedEl<HTMLElement>(root, tabId);
  if (!tabEl) return null;
  return tabEl.querySelector<HTMLElement>('.sub-panel.active')?.id ?? null;
}

/** Applies the visual state and document title for a resolved estudIA route without mutating history. */
function applyEstudiaRoute(root: HTMLElement, route: EstudiaRoute): void {
  const alreadyActive = isSameEstudiaRoute(getCurrentDomRoute(root), route);

  root.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach((btn) => {
    const isActive = btn.dataset.tab === route.tabId;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  root.querySelectorAll<HTMLElement>('.tab-content').forEach((section) => {
    section.classList.toggle('active', section.id === route.tabId);
  });

  const targetTab = getScopedEl<HTMLElement>(root, route.tabId);
  let mathTarget: HTMLElement | null = targetTab;

  if (targetTab && route.subId) {
    targetTab.querySelectorAll<HTMLButtonElement>('.sub-btn[data-sub-target]').forEach((btn) => {
      const isSubActive = btn.dataset.subTarget === route.subId;
      btn.classList.toggle('active', isSubActive);
      btn.setAttribute('aria-pressed', String(isSubActive));
    });
    targetTab.querySelectorAll<HTMLElement>('.sub-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === route.subId);
    });
    const targetSub = targetTab.querySelector<HTMLElement>(`#${route.subId}`);
    if (targetSub) {
      mathTarget = targetSub;
    }
  }

  document.title = route.title;

  if (!alreadyActive && mathTarget) {
    renderMath(mathTarget);
  }
}

/** Navigates to an estudIA route, pushing a browser history entry when the fragment changes. */
function navigateToEstudiaRoute(
  root: HTMLElement,
  route: EstudiaRoute,
  options?: { scrollToTop?: boolean }
): void {
  const sameDomRoute = isSameEstudiaRoute(getCurrentDomRoute(root), route);
  const hashMatches =
    window.location.hash === route.hash ||
    (route.tabId === 'tab-home' && window.location.hash === '');

  if (sameDomRoute && hashMatches) {
    if (options?.scrollToTop === true) {
      scrollToEstudiaTop(root);
    }
    return;
  }

  // Push history before mutating scroll so Astro ClientRouter saves the outgoing scroll position.
  if (window.location.hash !== route.hash) {
    if (transitionEnabledOnThisPage()) {
      void navigate(route.hash);
    } else {
      window.history.pushState(null, '', route.hash);
    }
  }

  applyEstudiaRoute(root, route);

  if (
    options?.scrollToTop === true ||
    (options?.scrollToTop !== false && root.getBoundingClientRect().top < 0)
  ) {
    scrollToEstudiaTop(root);
  }
}

/** Switches the active top-level course tab inside estudIA and records browser history. */
function switchTab(root: HTMLElement, tabId: string): void {
  const subId = tabId === 'tab-home' ? null : getPreferredCourseSubId(root, tabId);
  navigateToEstudiaRoute(root, routeForView(tabId, subId));
}

/** Switches the active sub-panel within a course section and records browser history. */
function switchSub(root: HTMLElement, parentId: string, subId: string): void {
  navigateToEstudiaRoute(root, routeForView(parentId, subId));
}

/** Navigates directly to a course tab and sub-panel from the overview cards or search. */
function jumpTo(
  root: HTMLElement,
  tabId: string,
  subId: string,
  options?: { scrollToTop?: boolean }
): void {
  navigateToEstudiaRoute(root, routeForView(tabId, subId), options);
}

function printCourseTorpedo(root: HTMLElement, tabId: string, subId: string): void {
  jumpTo(root, tabId, subId, { scrollToTop: false });
  requestAnimationFrame(() => window.print());
}

/** Calculates weighted NP/NPE and required final exam grade for a course. */
function calcCourseGrade(root: HTMLElement, course: CourseId): void {
  const cfg = COURSE_WEIGHTS[course];
  const out = getScopedEl<HTMLElement>(root, `grade-${course}-result`);
  if (!out) return;

  let np = 0;
  for (let i = 0; i < cfg.weights.length; i++) {
    const input = getScopedEl<HTMLInputElement>(root, `grade-${course}-${i}`);
    const val = input ? parseFloat(input.value) : NaN;
    if (Number.isNaN(val) || val < 1 || val > 7) {
      out.innerHTML =
        '<span style="color:var(--danger);">Todas las notas deben estar en escala 1.0 a 7.0.</span>';
      return;
    }
    np += val * cfg.weights[i];
  }

  const req395 = (3.95 - 0.7 * np) / 0.3;
  const req400 = (4.0 - 0.7 * np) / 0.3;
  let status = '';

  if (np >= 5.0) {
    status = `<span style="color:var(--success);font-weight:700;">EXIMIDO (${cfg.label} &ge; 5.0)</span> | No necesitas rendir examen.`;
  } else if (req395 <= 1.0) {
    status = `Rinde examen (<span style="color:var(--primary);font-weight:700;">&lt; 5.0</span>) | Con nota mínima <code>1.0</code> en examen ya apruebas (NF &ge; 4.0).`;
  } else if (req395 > 7.0) {
    status = `<span style="color:var(--danger);font-weight:700;">En riesgo:</span> requerirías <code>${req395.toFixed(2)}</code> (&gt; 7.0) para llegar a 3.95.`;
  } else {
    status = `Rinde examen (70% ${cfg.label} + 30% Ex) | Necesitas <span style="color:var(--warning);font-weight:700;">${req395.toFixed(2)}</span> para alcanzar NF = 3.95 (&rarr; 4.0), o <code>${req400.toFixed(2)}</code> para 4.00 exacto.`;
  }

  out.innerHTML = `<strong>${cfg.label} estimada:</strong> <code style="font-size:0.95rem;">${np.toFixed(2)}</code><br>${status}`;
}

// ==================== BST / ABO SIMULATOR ====================

function bstInsert(rootNode: BstNode | null, val: number): BstNode {
  if (!rootNode) return { info: val, izq: null, der: null };
  if (val < rootNode.info) rootNode.izq = bstInsert(rootNode.izq, val);
  else rootNode.der = bstInsert(rootNode.der, val);
  return rootNode;
}

function bstBuild(values: readonly number[]): BstNode | null {
  let rootNode: BstNode | null = null;
  values.forEach((v) => {
    rootNode = bstInsert(rootNode, v);
  });
  return rootNode;
}

function cloneBst(node: BstNode | null): BstNode | null {
  if (!node) return null;
  return {
    info: node.info,
    izq: cloneBst(node.izq),
    der: cloneBst(node.der)
  };
}

function bstMin(node: BstNode): number {
  let cur = node;
  while (cur.izq) cur = cur.izq;
  return cur.info;
}

function bstMax(node: BstNode): number {
  let cur = node;
  while (cur.der) cur = cur.der;
  return cur.info;
}

function bstDelete(
  rootNode: BstNode | null,
  val: number,
  mode: DeleteMode,
  state: BstDeleteState
): BstNode | null {
  if (!rootNode) return null;
  if (val < rootNode.info) {
    rootNode.izq = bstDelete(rootNode.izq, val, mode, state);
    return rootNode;
  }
  if (val > rootNode.info) {
    rootNode.der = bstDelete(rootNode.der, val, mode, state);
    return rootNode;
  }

  state.found = true;
  if (!rootNode.izq && !rootNode.der) {
    if (!state.note) state.note = `Hoja (${val}): se elimina directamente y retorna NULL.`;
    return null;
  }
  if (!rootNode.izq) {
    if (!state.note) {
      state.note = `1 hijo derecho (${val}): sube su subárbol derecho (${rootNode.der?.info ?? ''}).`;
    }
    return rootNode.der;
  }
  if (!rootNode.der) {
    if (!state.note) {
      state.note = `1 hijo izquierdo (${val}): sube su subárbol izquierdo (${rootNode.izq.info}).`;
    }
    return rootNode.izq;
  }

  if (mode === 'f3') {
    const rep = bstMin(rootNode.der);
    state.replacementVal = rep;
    state.note = `2 hijos en ${val} | Forma 3 ("menor de los mayores"): se reemplaza por ${rep} desde A->der y se elimina el ${rep} original.`;
    rootNode.info = rep;
    rootNode.der = bstDelete(rootNode.der, rep, mode, {
      found: true,
      note: state.note,
      replacementVal: rep
    });
  } else {
    const rep = bstMax(rootNode.izq);
    state.replacementVal = rep;
    state.note = `2 hijos en ${val} | Forma 4 ("mayor de los menores"): se reemplaza por ${rep} desde A->izq y se elimina el ${rep} original.`;
    rootNode.info = rep;
    rootNode.izq = bstDelete(rootNode.izq, rep, mode, {
      found: true,
      note: state.note,
      replacementVal: rep
    });
  }
  return rootNode;
}

function bstAnalyze(rootNode: BstNode | null): BstStats {
  const pre: number[] = [];
  const ino: number[] = [];
  const post: number[] = [];
  const niveles: number[] = [];
  const hojas: number[] = [];
  const interiores: number[] = [];
  const grado1: number[] = [];
  const grado2: number[] = [];
  let peso = 0;

  function walk(node: BstNode | null): number {
    if (!node) return 0;
    peso++;
    pre.push(node.info);
    const hL = walk(node.izq);
    ino.push(node.info);
    const hR = walk(node.der);
    post.push(node.info);
    const deg = (node.izq ? 1 : 0) + (node.der ? 1 : 0);
    if (deg === 0) {
      hojas.push(node.info);
    } else {
      interiores.push(node.info);
      if (deg === 1) grado1.push(node.info);
      else grado2.push(node.info);
    }
    return 1 + Math.max(hL, hR);
  }

  const alturaNiveles = walk(rootNode);
  if (rootNode) {
    const queue: BstNode[] = [rootNode];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (!cur) continue;
      niveles.push(cur.info);
      if (cur.izq) queue.push(cur.izq);
      if (cur.der) queue.push(cur.der);
    }
  }

  return {
    peso,
    alturaNiveles,
    alturaAristas: Math.max(0, alturaNiveles - 1),
    hojas,
    interiores,
    grado1,
    grado2,
    pre,
    ino,
    post,
    niveles
  };
}

function setABOPreset(root: HTMLElement, seq: string, delVal: string, mode: DeleteMode): void {
  const seqInput = getScopedEl<HTMLInputElement>(root, 'abo-seq');
  const delInput = getScopedEl<HTMLInputElement>(root, 'abo-del');
  const modeSelect = getScopedEl<HTMLSelectElement>(root, 'abo-mode');
  if (seqInput) seqInput.value = seq;
  if (delInput) delInput.value = delVal;
  if (modeSelect) modeSelect.value = mode;
  simulateABO(root);
}

/** Builds a binary search tree, prints structural metrics, and renders before/after SVGs. */
function simulateABO(root: HTMLElement): void {
  const seqInput = getScopedEl<HTMLInputElement>(root, 'abo-seq');
  const delInput = getScopedEl<HTMLInputElement>(root, 'abo-del');
  const modeSelect = getScopedEl<HTMLSelectElement>(root, 'abo-mode');
  const out = getScopedEl<HTMLElement>(root, 'abo-result');
  if (!seqInput || !out) return;

  const nums = seqInput.value
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((x) => !Number.isNaN(x));

  if (nums.length === 0) {
    out.textContent = 'Ingresa enteros separados por coma (ej: 40, 10, 60).';
    return;
  }

  const tree = bstBuild(nums);
  const stats = bstAnalyze(tree);
  let html = `<strong>Peso:</strong> <code>${stats.peso}</code> | <strong>Altura:</strong> <code>${stats.alturaNiveles}</code> niveles (${stats.alturaAristas} aristas) | <strong>Llamadas rec. (2n+1):</strong> <code>${2 * stats.peso + 1}</code><br>`;
  html += `<strong>Hojas:</strong> <code>${stats.hojas.join(' ') || 'ninguna'}</code> | <strong>Interiores:</strong> <code>${stats.interiores.join(' ') || 'ninguno'}</code> | <strong>Grado 1:</strong> <code>${stats.grado1.join(' ') || 'ninguno'}</code><br>`;
  html += `<strong>PreOrden:</strong> <code>${stats.pre.join(' ')}</code><br>`;
  html += `<strong>InOrden:</strong> <code>${stats.ino.join(' ')}</code><br>`;
  html += `<strong>PostOrden:</strong> <code>${stats.post.join(' ')}</code><br>`;
  html += `<strong>Por Niveles:</strong> <span style="color:var(--primary);font-weight:700;">${stats.niveles.join(' ')}</span>`;

  let visualsHtml = `<div class="estudia-bst-grid">${renderBstSvg(tree, { label: 'Árbol ABO actual' })}</div>`;

  const delRaw = (delInput?.value ?? '').trim();
  if (delRaw !== '') {
    const target = parseInt(delRaw, 10);
    const mode: DeleteMode = modeSelect?.value === 'f4' ? 'f4' : 'f3';
    if (Number.isNaN(target)) {
      html += '<br><span style="color:var(--danger);">El valor a eliminar debe ser un entero.</span>';
    } else {
      const state: BstDeleteState = { found: false, note: '', replacementVal: null };
      const afterRoot = bstDelete(cloneBst(tree), target, mode, state);
      if (!state.found) {
        html += `<hr style="border:0;border-top:1px solid var(--border-card);margin:0.5rem 0;"><span style="color:var(--warning);">El valor <code>${target}</code> no existe en el ABO.</span>`;
      } else {
        const after = bstAnalyze(afterRoot);
        html += '<hr style="border:0;border-top:1px solid var(--border-card);margin:0.5rem 0;">';
        html += `<strong>Eliminación de ${target}:</strong> ${state.note}<br>`;
        html += `<strong>Niveles tras eliminar:</strong> <span style="color:var(--success);font-weight:700;">${after.niveles.join(' ') || '(árbol vacío)'}</span><br>`;
        html += `<strong>InOrden tras eliminar:</strong> <code>${after.ino.join(' ') || '(vacío)'}</code>`;

        const beforeSvg = renderBstSvg(tree, {
          label: `Antes (elimina ${target})`,
          removedVal: target,
          replacementVal: state.replacementVal
        });
        const afterSvg = renderBstSvg(afterRoot, {
          label: `Después (${mode === 'f3' ? 'Forma 3' : 'Forma 4'})`,
          promotedVal: state.replacementVal
        });
        visualsHtml = `<div class="estudia-bst-grid">${beforeSvg}${afterSvg}</div>`;
      }
    }
  }

  out.innerHTML = `${html}${visualsHtml}`;
}

// ==================== GRAPH ANALYZER (AED) ====================

function loadGraphPreset(root: HTMLElement): void {
  const presetSelect = getScopedEl<HTMLSelectElement>(root, 'graph-preset');
  const matrixArea = getScopedEl<HTMLTextAreaElement>(root, 'graph-matrix');
  const startInput = getScopedEl<HTMLInputElement>(root, 'graph-start');
  if (!presetSelect) return;
  const preset = GRAPH_PRESETS[presetSelect.value];
  if (!preset) return;
  if (matrixArea) matrixArea.value = preset.matrix;
  if (startInput) startInput.value = String(preset.start);
  analyzeAEDGraph(root);
}

function runGraphDFS(mat: readonly (readonly number[])[], start: number): { order: number[]; vis: boolean[] } {
  const n = mat.length;
  const vis = Array<boolean>(n).fill(false);
  const order: number[] = [];

  function dfs(u: number): void {
    vis[u] = true;
    order.push(u);
    for (let v = 0; v < n; v++) {
      if (mat[u][v] !== 0 && !vis[v]) dfs(v);
    }
  }

  dfs(start);
  return { order, vis };
}

function runGraphBFS(mat: readonly (readonly number[])[], start: number): number[] {
  const n = mat.length;
  const vis = Array<boolean>(n).fill(false);
  const queue: number[] = [start];
  const order: number[] = [];
  vis[start] = true;

  while (queue.length > 0) {
    const u = queue.shift();
    if (u === undefined) continue;
    order.push(u);
    for (let v = 0; v < n; v++) {
      if (mat[u][v] !== 0 && !vis[v]) {
        vis[v] = true;
        queue.push(v);
      }
    }
  }
  return order;
}

/** Analyzes an adjacency/cost matrix for degrees, sinks/sources, regularity, DFS/BFS, and Dijkstra trace. */
function analyzeAEDGraph(root: HTMLElement): void {
  const matrixArea = getScopedEl<HTMLTextAreaElement>(root, 'graph-matrix');
  const startInput = getScopedEl<HTMLInputElement>(root, 'graph-start');
  const out = getScopedEl<HTMLElement>(root, 'graph-result');
  if (!matrixArea || !out) return;

  const rawLines = matrixArea.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    out.textContent = 'Ingresa una matriz cuadrada de adyacencia o costos.';
    return;
  }

  const mat = rawLines.map((line) =>
    line
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map((val) => parseFloat(val))
  );
  const n = mat.length;
  if (n < 2 || n > 8 || mat.some((row) => row.length !== n || row.some((v) => Number.isNaN(v)))) {
    out.textContent = 'La matriz debe ser cuadrada de tamaño entre 2x2 y 8x8 con números válidos.';
    return;
  }

  const x = parseInt(startInput?.value || '0', 10);
  if (Number.isNaN(x) || x < 0 || x >= n) {
    out.textContent = `El nodo analizado x debe estar entre 0 y ${n - 1}.`;
    return;
  }

  let symmetric = true;
  let hasNegative = false;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] < 0) hasNegative = true;
      if (mat[i][j] !== mat[j][i]) symmetric = false;
    }
  }

  let inDeg = 0;
  let outDeg = 0;
  for (let i = 0; i < n; i++) {
    if (mat[i][x] !== 0) inDeg++;
    if (mat[x][i] !== 0) outDeg++;
  }
  const hasLoop = mat[x][x] !== 0;
  const sumideros: number[] = [];
  const fuentes: number[] = [];
  for (let k = 0; k < n; k++) {
    let incoming = 0;
    let outgoing = 0;
    for (let i = 0; i < n; i++) {
      if (mat[i][k] !== 0) incoming++;
      if (mat[k][i] !== 0) outgoing++;
    }
    if (incoming > 0 && outgoing === 0) sumideros.push(k);
    if (incoming === 0 && outgoing > 0) fuentes.push(k);
  }

  let kRegularNote = 'No';
  if (symmetric) {
    const degs = mat.map((row) => row.filter((v) => v !== 0).length);
    if (degs.every((d) => d === degs[0])) kRegularNote = `Sí (${degs[0]}-regular)`;
  } else {
    const outDegs = mat.map((row) => row.filter((v) => v !== 0).length);
    if (outDegs.every((d) => d === outDegs[0])) kRegularNote = `Salida regular (grado ${outDegs[0]})`;
  }

  let connNote = '';
  if (symmetric) {
    const visitedAll = Array<boolean>(n).fill(false);
    let comps = 0;
    for (let i = 0; i < n; i++) {
      if (!visitedAll[i]) {
        comps++;
        const res = runGraphDFS(mat, i);
        res.vis.forEach((v, idx) => {
          if (v) visitedAll[idx] = true;
        });
      }
    }
    connNote = comps === 1 ? 'Conexo (1 componente)' : `Desconexo (${comps} componentes conexas)`;
  } else {
    connNote = 'Grafo dirigido (asimétrico)';
  }

  const dfsRes = runGraphDFS(mat, x);
  const bfsOrder = runGraphBFS(mat, x);

  let roleX = 'Intermedio';
  if (inDeg === 0 && outDeg === 0) roleX = 'Aislado';
  else if (inDeg > 0 && outDeg === 0) roleX = 'Sumidero';
  else if (inDeg === 0 && outDeg > 0) roleX = 'Fuente';

  let html = `<strong>Tipo:</strong> <code>${symmetric ? 'No dirigido' : 'Dirigido'}</code> | <strong>Estado:</strong> <code>${connNote}</code> | <strong>k-regular:</strong> <code>${kRegularNote}</code><br>`;
  html += `<strong>Nodo ${x}:</strong> Entrada=<code>${inDeg}</code>, Salida=<code>${outDeg}</code>, Rol=<code>${roleX}</code>, Lazo=<code>${hasLoop ? 'Sí' : 'No'}</code><br>`;
  html += `<strong>Sumideros globales:</strong> <code>${sumideros.length ? sumideros.join(', ') : 'ninguno'}</code> | <strong>Fuentes:</strong> <code>${fuentes.length ? fuentes.join(', ') : 'ninguna'}</code><br>`;
  html += `<strong>DFS (<code>Profundidad(${x})</code>):</strong> <span style="color:var(--primary);font-weight:700;">${dfsRes.order.join(' ')}</span><br>`;
  html += `<strong>BFS (<code>Amplitud(${x})</code>):</strong> <span style="color:var(--primary);font-weight:700;">${bfsOrder.join(' ')}</span>`;

  if (hasNegative) {
    html +=
      '<br><span style="color:var(--warning);font-weight:600;">Dijkstra omitido: hay costos negativos en la matriz (PTEC101 asume pesos &ge; 0).</span>';
  } else {
    const INF = 1e9;
    const costo = Array<number>(n).fill(INF);
    const pred = Array<number>(n).fill(-1);
    const vis = Array<boolean>(n).fill(false);
    const dijkstraSteps: DijkstraStep[] = [];
    costo[x] = 0;

    let iter = 0;
    for (let step = 0; step < n; step++) {
      let u = -1;
      for (let i = 0; i < n; i++) {
        if (!vis[i] && (u === -1 || costo[i] < costo[u])) u = i;
      }
      if (u === -1 || costo[u] === INF) break;
      iter++;
      vis[u] = true;
      const relaxed: number[] = [];
      for (let v = 0; v < n; v++) {
        if (mat[u][v] > 0 && costo[u] + mat[u][v] < costo[v]) {
          costo[v] = costo[u] + mat[u][v];
          pred[v] = u;
          relaxed.push(v);
        }
      }
      dijkstraSteps.push({
        iter,
        fixedNode: u,
        fixedCost: costo[u],
        costs: [...costo],
        relaxed
      });
    }

    const rows: string[] = [];
    for (let v = 0; v < n; v++) {
      if (costo[v] === INF) {
        rows.push(`<tr><td>${v}</td><td>∞</td><td>Inalcanzable</td></tr>`);
      } else {
        const path: number[] = [];
        let cur = v;
        while (cur !== -1) {
          path.unshift(cur);
          if (cur === x) break;
          cur = pred[cur];
        }
        rows.push(
          `<tr><td><strong>${v}</strong></td><td><code>${costo[v]}</code></td><td><code>${path.join(' -> ')}</code></td></tr>`
        );
      }
    }
    html += `<table class="dense-table" style="margin-top:0.55rem;font-size:0.78rem;"><thead><tr><th>Destino</th><th>Costo[]</th><th>Camino mínimo desde ${x}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
    html += renderDijkstraTrace(dijkstraSteps, n, x, INF);
  }

  out.innerHTML = html;
}

// ==================== ADA SIMULATORS ====================

/** Solves Master Theorem division recurrences T(n) = a T(n/b) + Theta(n^k). */
function solveRecurrence(root: HTMLElement): void {
  const aInput = getScopedEl<HTMLInputElement>(root, 'rec-a');
  const bInput = getScopedEl<HTMLInputElement>(root, 'rec-b');
  const kInput = getScopedEl<HTMLInputElement>(root, 'rec-k');
  const out = getScopedEl<HTMLElement>(root, 'rec-result');
  if (!out) return;

  const a = parseFloat(aInput?.value || '1');
  const b = parseFloat(bInput?.value || '2');
  const k = parseFloat(kInput?.value || '0');
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(k) || a < 1 || b <= 1 || k < 0) {
    out.textContent = 'Valores inválidos (requiere a ≥ 1, b > 1, k ≥ 0).';
    return;
  }

  const bk = Math.pow(b, k);
  const logba = Math.log(a) / Math.log(b);
  let caso: string;
  let res: string;
  if (Math.abs(a - bk) < 1e-6) {
    caso = 'Caso 2 (a = b^k)';
    res = `Θ(n^${k} log n)`;
  } else if (a < bk) {
    caso = 'Caso 1 (a < b^k)';
    res = `Θ(n^${k})`;
  } else {
    caso = 'Caso 3 (a > b^k)';
    res = `Θ(n^${Number.isInteger(logba) ? logba : logba.toFixed(3)})`;
  }
  out.innerHTML = `<strong>b^k =</strong> ${b}^${k} = <code>${bk.toFixed(2)}</code> vs <strong>a =</strong> <code>${a}</code><br><strong>${caso}:</strong> <span style="color:var(--success);font-weight:700;">${res}</span>`;
}

/** Runs Kadane's maximum subarray algorithm with a step-by-step trace. */
function simulateKadane(root: HTMLElement): void {
  const input = getScopedEl<HTMLInputElement>(root, 'kadane-input');
  const out = getScopedEl<HTMLElement>(root, 'kadane-result');
  if (!input || !out) return;

  const arr = input.value
    .split(',')
    .map((x) => parseFloat(x.trim()))
    .filter((x) => !Number.isNaN(x));

  if (arr.length === 0) {
    out.textContent = 'Ingresa números separados por coma.';
    return;
  }

  let cur = arr[0];
  let best = arr[0];
  let start = 0;
  let bestStart = 0;
  let bestEnd = 0;
  const steps = [`i=0 (${arr[0]}): cur=${cur}, best=${best}`];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > cur + arr[i]) {
      cur = arr[i];
      start = i;
    } else {
      cur += arr[i];
    }
    if (cur > best) {
      best = cur;
      bestStart = start;
      bestEnd = i;
    }
    steps.push(`i=${i} (${arr[i]}): cur=${cur}, best=${best}`);
  }

  out.innerHTML = `<strong>Suma máxima:</strong> <span style="color:var(--success);font-weight:700;">${best}</span> (subarreglo [${arr.slice(bestStart, bestEnd + 1).join(', ')}])<br><span style="color:var(--text-muted);font-size:0.8rem;">${steps.join(' | ')}</span>`;
}

/** Computes Longest Common Subsequence length, sequence, and visible DP table. */
function generateLCS(root: HTMLElement): void {
  const xInput = getScopedEl<HTMLInputElement>(root, 'lcs-x');
  const yInput = getScopedEl<HTMLInputElement>(root, 'lcs-y');
  const out = getScopedEl<HTMLElement>(root, 'lcs-result');
  if (!out) return;

  const X = (xInput?.value ?? '').trim();
  const Y = (yInput?.value ?? '').trim();
  if (!X || !Y) {
    out.textContent = 'Ingresa ambas cadenas.';
    return;
  }

  const m = X.length;
  const n = Y.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        X[i - 1] === Y[j - 1] ? 1 + dp[i - 1][j - 1] : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const pathCells = new Set<string>();
  const matchCells = new Set<string>();
  let i = m;
  let j = n;
  let seq = '';
  while (i > 0 && j > 0) {
    pathCells.add(`${i},${j}`);
    if (X[i - 1] === Y[j - 1]) {
      matchCells.add(`${i},${j}`);
      seq = X[i - 1] + seq;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  pathCells.add(`${i},${j}`);

  const safeSeq = seq ? escapeHtml(seq) : '(vacía)';
  const dpTableHtml = renderLcsDpTable(X, Y, dp, pathCells, matchCells);
  out.innerHTML = `<strong>Longitud LCS:</strong> <span style="color:var(--success);font-weight:700;">${dp[m][n]}</span> | <strong>Subsecuencia:</strong> <code>${safeSeq}</code>${dpTableHtml}`;
}

// ==================== IA CALCULATORS ====================

function entropy(pos: number, neg: number): number {
  const total = pos + neg;
  if (total === 0) return 0;
  const p1 = pos / total;
  const p2 = neg / total;
  return (p1 > 0 ? -p1 * Math.log2(p1) : 0) + (p2 > 0 ? -p2 * Math.log2(p2) : 0);
}

/** Computes ID3 split entropy, remainder, and information gain. */
function calcDecisionTree(root: HTMLElement): void {
  const p1 = Math.max(0, parseInt(getScopedEl<HTMLInputElement>(root, 'dt-p1')?.value || '0', 10));
  const n1 = Math.max(0, parseInt(getScopedEl<HTMLInputElement>(root, 'dt-n1')?.value || '0', 10));
  const p2 = Math.max(0, parseInt(getScopedEl<HTMLInputElement>(root, 'dt-p2')?.value || '0', 10));
  const n2 = Math.max(0, parseInt(getScopedEl<HTMLInputElement>(root, 'dt-n2')?.value || '0', 10));
  const out = getScopedEl<HTMLElement>(root, 'dt-result');
  if (!out) return;

  const t1 = p1 + n1;
  const t2 = p2 + n2;
  const total = t1 + t2;
  if (!total) {
    out.textContent = 'Ingresa al menos un registro.';
    return;
  }

  const hP = entropy(p1 + p2, n1 + n2);
  const h1 = entropy(p1, n1);
  const h2 = entropy(p2, n2);
  const resto = (t1 / total) * h1 + (t2 / total) * h2;
  const gain = hP - resto;
  out.innerHTML = `<strong>H(Padre):</strong> <code>${hP.toFixed(6)}</code><br><strong>H(R1):</strong> <code>${h1.toFixed(6)}</code> | <strong>H(R2):</strong> <code>${h2.toFixed(6)}</code><br><strong>Resto R:</strong> <code>${resto.toFixed(6)}</code><br><strong>Ganancia G:</strong> <span style="color:var(--success);font-weight:700;">${gain.toFixed(6)}</span> bits`;
}

/** Evaluates Accuracy, Sensitivity, Specificity, Precision, and F1 from confusion counts. */
function calcConfusionMatrix(root: HTMLElement): void {
  const vp = Math.max(0, parseFloat(getScopedEl<HTMLInputElement>(root, 'cm-vp')?.value || '0'));
  const fn = Math.max(0, parseFloat(getScopedEl<HTMLInputElement>(root, 'cm-fn')?.value || '0'));
  const fp = Math.max(0, parseFloat(getScopedEl<HTMLInputElement>(root, 'cm-fp')?.value || '0'));
  const vn = Math.max(0, parseFloat(getScopedEl<HTMLInputElement>(root, 'cm-vn')?.value || '0'));
  const out = getScopedEl<HTMLElement>(root, 'cm-result');
  if (!out) return;

  const total = vp + fn + fp + vn;
  if (!total) {
    out.textContent = 'Ingresa valores mayores a 0.';
    return;
  }

  const acc = ((vp + vn) / total) * 100;
  const rec = vp + fn ? (vp / (vp + fn)) * 100 : 0;
  const esp = vn + fp ? (vn / (vn + fp)) * 100 : 0;
  const prec = vp + fp ? (vp / (vp + fp)) * 100 : 0;
  const p = prec / 100;
  const r = rec / 100;
  const f1 = p + r ? (2 * p * r) / (p + r) : 0;
  out.innerHTML = `<strong>Exactitud:</strong> <code>${acc.toFixed(2)}%</code> | <strong>Sensibilidad:</strong> <code>${rec.toFixed(2)}%</code><br><strong>Especificidad:</strong> <code>${esp.toFixed(2)}%</code> | <strong>Precisión:</strong> <code>${prec.toFixed(2)}%</code><br><strong>F1-Score:</strong> <span style="color:var(--primary);font-weight:700;">${f1.toFixed(2)}</span>`;
}

/** Computes posterior probability P(H | +) for 1 or k conditionally independent tests. */
function calcBayes(root: HTMLElement): void {
  const ph = parseFloat(getScopedEl<HTMLInputElement>(root, 'by-ph')?.value || '0');
  const k = Math.max(1, parseInt(getScopedEl<HTMLInputElement>(root, 'by-k')?.value || '1', 10));
  const tp = parseFloat(getScopedEl<HTMLInputElement>(root, 'by-tp')?.value || '0');
  const fp = parseFloat(getScopedEl<HTMLInputElement>(root, 'by-fp')?.value || '0');
  const out = getScopedEl<HTMLElement>(root, 'by-result');
  if (!out) return;

  const wH = ph * Math.pow(tp, k);
  const wNot = (1 - ph) * Math.pow(fp, k);
  const ev = wH + wNot;
  if (!ev) {
    out.textContent = 'Evidencia con probabilidad 0.';
    return;
  }
  out.innerHTML = `<strong>w(H):</strong> <code>${wH.toFixed(6)}</code> | <strong>w(¬H):</strong> <code>${wNot.toFixed(6)}</code><br><strong>P(H | +):</strong> <span style="color:var(--success);font-weight:700;">${((wH / ev) * 100).toFixed(2)}%</span>`;
}

/** Evaluates Simulated Annealing Metropolis acceptance criterion for minimization. */
function calcSA(root: HTMLElement): void {
  const fCur = parseFloat(getScopedEl<HTMLInputElement>(root, 'sa-cur')?.value || '0');
  const fNew = parseFloat(getScopedEl<HTMLInputElement>(root, 'sa-new')?.value || '0');
  const temp = parseFloat(getScopedEl<HTMLInputElement>(root, 'sa-t')?.value || '1');
  const r = parseFloat(getScopedEl<HTMLInputElement>(root, 'sa-r')?.value || '0');
  const out = getScopedEl<HTMLElement>(root, 'sa-result');
  if (!out) return;

  if (Number.isNaN(temp) || temp <= 0) {
    out.textContent = 'La temperatura T debe ser mayor que 0.';
    return;
  }
  const delta = fNew - fCur;
  if (delta <= 0) {
    out.innerHTML = `<strong>Δ =</strong> <code>${delta}</code> (mejora o empata en minimización)<br><strong>Decisión:</strong> <span style="color:var(--success);font-weight:700;">ACEPTA siempre</span>`;
    return;
  }
  const prob = Math.exp(-delta / temp);
  const accepted = r < prob;
  const color = accepted ? 'var(--success)' : 'var(--danger)';
  const label = accepted ? 'ACEPTA (r < P)' : 'RECHAZA (r ≥ P)';
  out.innerHTML = `<strong>Δ =</strong> <code>+${delta}</code> | <strong>e^(-Δ/T) =</strong> <code>${prob.toFixed(4)}</code><br><strong>Decisión:</strong> <span style="color:${color};font-weight:700;">${label}</span>`;
}

function parsePair(raw: string): [number, number] | null {
  const parts = raw
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((v) => !Number.isNaN(v));
  return parts.length >= 2 ? [parts[0], parts[1]] : null;
}

/** Computes Manhattan, Euclidean, and Chebyshev distances between two 2D points. */
function calcDistances(root: HTMLElement): void {
  const aInput = getScopedEl<HTMLInputElement>(root, 'dist-a');
  const bInput = getScopedEl<HTMLInputElement>(root, 'dist-b');
  const out = getScopedEl<HTMLElement>(root, 'dist-result');
  if (!out) return;

  const a = parsePair(aInput?.value || '');
  const b = parsePair(bInput?.value || '');
  if (!a || !b) {
    out.textContent = 'Ingresa coordenadas válidas en formato x, y.';
    return;
  }

  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  const manhattan = dx + dy;
  const euclidean = Math.sqrt(dx * dx + dy * dy);
  const chebyshev = Math.max(dx, dy);
  out.innerHTML = `<strong>Manhattan:</strong> <code>${manhattan}</code> | <strong>Chebyshev:</strong> <code>${chebyshev}</code><br><strong>Euclidiana:</strong> <span style="color:var(--primary);font-weight:700;">${euclidean.toFixed(4)}</span>`;
}

// ==================== GLOBAL CONCEPT SEARCH ====================

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildSearchIndex(root: HTMLElement): SearchEntry[] {
  const courseConfigs: Array<{
    tabId: 'tab-aed' | 'tab-ada' | 'tab-ia';
    badge: 'AED' | 'ADA' | 'IA';
    cls: 'badge-aed' | 'badge-ada' | 'badge-ia';
    prefix: string;
  }> = [
    { tabId: 'tab-aed', badge: 'AED', cls: 'badge-aed', prefix: 'aed' },
    { tabId: 'tab-ada', badge: 'ADA', cls: 'badge-ada', prefix: 'ada' },
    { tabId: 'tab-ia', badge: 'IA', cls: 'badge-ia', prefix: 'ia' }
  ];

  const entries: SearchEntry[] = [];

  for (const cfg of courseConfigs) {
    const tabEl = getScopedEl<HTMLElement>(root, cfg.tabId);
    if (!tabEl) continue;

    const panels: Array<{ subId: string; selector: string; titleSel: string; section: string }> = [
      { subId: `${cfg.prefix}-torpedo`, selector: '.card', titleSel: '.card-title', section: 'Torpedo' },
      {
        subId: `${cfg.prefix}-guide`,
        selector: '.guide-section, .analysis-section',
        titleSel: 'h2, h3',
        section: 'Guía'
      },
      { subId: `${cfg.prefix}-tools`, selector: '.tool-card', titleSel: 'h3', section: 'Simulador' },
      { subId: `${cfg.prefix}-syllabus`, selector: '.guide-section', titleSel: 'h2, h3', section: 'Syllabus' },
      { subId: `${cfg.prefix}-syllabus`, selector: '.tool-card', titleSel: 'h3', section: 'Calculadora' }
    ];

    for (const panelCfg of panels) {
      const panelEl = tabEl.querySelector<HTMLElement>(`#${panelCfg.subId}`);
      if (!panelEl) continue;

      panelEl.querySelectorAll<HTMLElement>(panelCfg.selector).forEach((el) => {
        const titleEl = el.querySelector<HTMLElement>(panelCfg.titleSel);
        const title = (titleEl?.textContent ?? panelCfg.section).replace(/\s+/g, ' ').trim();
        const rawText = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (!rawText) return;

        entries.push({
          courseBadge: cfg.badge,
          courseClass: cfg.cls,
          tabId: cfg.tabId,
          subId: panelCfg.subId,
          section: panelCfg.section,
          title,
          bodyText: rawText,
          normTitle: normalizeSearchText(title),
          normBody: normalizeSearchText(rawText),
          element: el
        });
      });
    }
  }

  return entries;
}

function highlightNormalizedTerms(rawText: string, terms: readonly string[]): string {
  const normChars: string[] = [];
  const origIdxMap: number[] = [];

  for (let i = 0; i < rawText.length; i++) {
    const decomposed = rawText[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    for (let k = 0; k < decomposed.length; k++) {
      normChars.push(decomposed[k]);
      origIdxMap.push(i);
    }
  }

  const normText = normChars.join('');
  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    if (!term) continue;
    let searchFrom = 0;
    while (searchFrom < normText.length) {
      const idx = normText.indexOf(term, searchFrom);
      if (idx === -1) break;
      const startOrig = origIdxMap[idx];
      const endOrig = origIdxMap[idx + term.length - 1] + 1;
      ranges.push([startOrig, endOrig]);
      searchFrom = idx + term.length;
    }
  }

  if (ranges.length === 0) return escapeHtml(rawText);

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [ranges[0]];
  for (let r = 1; r < ranges.length; r++) {
    const prev = merged[merged.length - 1];
    const cur = ranges[r];
    if (cur[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }

  let out = '';
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) out += escapeHtml(rawText.slice(cursor, start));
    out += `<mark>${escapeHtml(rawText.slice(start, end))}</mark>`;
    cursor = end;
  }
  if (cursor < rawText.length) out += escapeHtml(rawText.slice(cursor));
  return out;
}

function buildSnippet(entry: SearchEntry, terms: readonly string[]): string {
  let firstMatchIdx = -1;
  for (const term of terms) {
    const idx = entry.normBody.indexOf(term);
    if (idx !== -1 && (firstMatchIdx === -1 || idx < firstMatchIdx)) {
      firstMatchIdx = idx;
    }
  }
  const start = firstMatchIdx > 32 ? firstMatchIdx - 28 : 0;
  const slice = entry.bodyText.slice(start, start + 112).trim();
  const prefix = start > 0 ? '...' : '';
  const suffix = start + 112 < entry.bodyText.length ? '...' : '';
  return `${prefix}${highlightNormalizedTerms(slice, terms)}${suffix}`;
}

function setupGlobalSearch(root: HTMLElement): void {
  const input = getScopedEl<HTMLInputElement>(root, 'estudia-global-search');
  const clearBtn = getScopedEl<HTMLButtonElement>(root, 'estudia-search-clear');
  const resultsEl = getScopedEl<HTMLElement>(root, 'estudia-search-results');
  if (!input || !clearBtn || !resultsEl) return;

  const index = buildSearchIndex(root);
  let activeResults: SearchEntry[] = [];
  let highlightTimer: number | null = null;

  function jumpToSearchResult(entry: SearchEntry): void {
    jumpTo(root, entry.tabId, entry.subId, { scrollToTop: false });
    resultsEl!.hidden = true;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      entry.element.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      root.querySelectorAll('.estudia-jump-highlight').forEach((el) => el.classList.remove('estudia-jump-highlight'));
      entry.element.classList.add('estudia-jump-highlight');
      if (highlightTimer !== null) window.clearTimeout(highlightTimer);
      highlightTimer = window.setTimeout(() => {
        entry.element.classList.remove('estudia-jump-highlight');
      }, 1800);
    });
  }

  function renderSearchResults(): void {
    const rawQuery = input!.value.trim();
    clearBtn!.hidden = rawQuery.length === 0;

    if (rawQuery.length < 2) {
      activeResults = [];
      resultsEl!.hidden = true;
      resultsEl!.innerHTML = '';
      return;
    }

    const normQuery = normalizeSearchText(rawQuery);
    const terms = normQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
      resultsEl!.hidden = true;
      return;
    }

    const scored: Array<{ entry: SearchEntry; score: number }> = [];
    for (const entry of index) {
      const combined = `${entry.normTitle} ${entry.normBody}`;
      if (!terms.every((t) => combined.includes(t))) continue;

      let score = 0;
      if (entry.normTitle.includes(normQuery)) score += 10;
      for (const term of terms) {
        if (entry.normTitle.includes(term)) score += 3;
        if (entry.normBody.includes(term)) score += 1;
      }
      scored.push({ entry, score });
    }

    scored.sort((a, b) => b.score - a.score);
    activeResults = scored.slice(0, 10).map((item) => item.entry);

    if (activeResults.length === 0) {
      resultsEl!.innerHTML = `<div class="estudia-search-empty">Sin coincidencias para "<code>${escapeHtml(rawQuery)}</code>" en AED, ADA o IA.</div>`;
      resultsEl!.hidden = false;
      return;
    }

    resultsEl!.innerHTML = activeResults
      .map(
        (entry, idx) =>
          `<button type="button" class="estudia-search-item" data-search-idx="${idx}">` +
          `<div class="estudia-search-meta">` +
          `<span class="estudia-search-course-badge ${entry.courseClass}">${entry.courseBadge}</span>` +
          `<span class="estudia-search-section">${escapeHtml(entry.section)}</span>` +
          `</div>` +
          `<div class="estudia-search-title">${highlightNormalizedTerms(entry.title, terms)}</div>` +
          `<div class="estudia-search-snippet">${buildSnippet(entry, terms)}</div>` +
          `</button>`
      )
      .join('');
    resultsEl!.hidden = false;
  }

  input.addEventListener('input', renderSearchResults);
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) renderSearchResults();
  });
  input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      input.value = '';
      clearBtn.hidden = true;
      resultsEl.hidden = true;
      activeResults = [];
      return;
    }
    if (event.key === 'Enter' && activeResults.length > 0) {
      event.preventDefault();
      jumpToSearchResult(activeResults[0]);
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    resultsEl.hidden = true;
    activeResults = [];
    input.focus();
  });

  resultsEl.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const itemBtn = target.closest<HTMLButtonElement>('[data-search-idx]');
    if (!itemBtn || itemBtn.dataset.searchIdx === undefined) return;
    const idx = parseInt(itemBtn.dataset.searchIdx, 10);
    const chosen = activeResults[idx];
    if (chosen) jumpToSearchResult(chosen);
  });

  if (document.documentElement.dataset.estudiaOutsideBound !== 'true') {
    document.documentElement.dataset.estudiaOutsideBound = 'true';
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const shell = document.querySelector('.estudia-search-shell');
      const dropdown = document.getElementById('estudia-search-results');
      if (shell && dropdown && !dropdown.hidden && !shell.contains(target)) {
        dropdown.hidden = true;
      }
    });
  }
}

// ==================== DYNAMIC QUIZZES & MISTAKE REVIEW ====================

function createDynamicItem(course: CourseId, raw: RawQuizItem): QuizItem {
  const sig = `${raw.q}|${raw.opts[raw.ans] ?? ''}`;
  return {
    ...raw,
    id: `${course}-dyn-${hashText(sig)}`
  };
}

function dynamicQuestions(course: CourseId, unitFilter: string = 'all'): QuizItem[] {
  if (course === 'aed') {
    const out: QuizItem[] = [];
    if (unitFilter === 'all' || unitFilter === 'u1') {
      const chain = Math.random() < 0.5 ? 'L->sig->sig' : 'L->sig';
      const label = chain === 'L->sig->sig' ? 'tercer' : 'segundo';
      const prevChain = chain === 'L->sig->sig' ? 'L->sig' : 'L';
      out.push(
        createDynamicItem(course, {
          unit: 'u1',
          tag: 'Dinámico U1 · Punteros C',
          q: `Tienes una Lista L y el puntero aux ya apunta al ${label} nodo (${chain}). ¿Qué secuencia elimina ese nodo de forma segura sin fugas ni puntero colgante?`,
          opts: [
            `${prevChain}->sig = aux->sig; free(aux); aux = NULL;`,
            `free(aux); ${prevChain}->sig = aux->sig; aux = NULL;`,
            `aux = aux->sig; free(L);`,
            `${prevChain}->sig = NULL; free(${prevChain});`
          ],
          ans: 0,
          exp: `Primero redirige ${prevChain}->sig hacia aux->sig para no perder el resto de la lista, luego libera con free(aux) y deja aux = NULL.`
        })
      );
    }
    if (unitFilter === 'all' || unitFilter === 'u2') {
      const mat = Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => (i !== j && Math.random() < 0.45 ? 1 : 0))
      );
      const node = Math.floor(Math.random() * 4);
      let inD = 0;
      let outD = 0;
      for (let k = 0; k < 4; k++) {
        if (mat[k][node] !== 0) inD++;
        if (mat[node][k] !== 0) outD++;
      }
      const correct = `Entrada = ${inD}, Salida = ${outD}`;
      const cand = new Set<string>([correct]);
      const candidates = [
        `Entrada = ${outD}, Salida = ${inD}`,
        `Entrada = ${(inD + 1) % 4}, Salida = ${outD}`,
        `Entrada = ${inD}, Salida = ${(outD + 1) % 4}`,
        `Entrada = ${(inD + 2) % 4}, Salida = ${(outD + 1) % 4}`
      ];
      for (const item of candidates) {
        if (cand.size < 4) cand.add(item);
      }
      const matStr = mat.map((row, idx) => `${idx}:[${row.join(' ')}]`).join(' | ');
      out.push(
        createDynamicItem(course, {
          unit: 'u2',
          tag: 'Dinámico U2 · Matriz Grafo',
          q: `En el grafo dirigido 4x4 (${matStr}), ¿cuáles son los grados de entrada y salida del nodo x = ${node}?`,
          opts: Array.from(cand),
          ans: 0,
          exp: `Columna ${node} (G[i][${node}]!=0) suma ${inD} de entrada; fila ${node} (G[${node}][i]!=0) suma ${outD} de salida.`
        })
      );
    }
    if (unitFilter === 'all' || unitFilter === 'u3') {
      const pool = [10, 20, 30, 60, 70, 80, 90].sort(() => Math.random() - 0.5).slice(0, 4);
      const seq = [50, ...pool];
      const tree = bstBuild(seq);
      const stats = bstAnalyze(tree);
      const correct = stats.niveles.join(' ');
      const distSet = new Set<string>([correct]);
      [
        stats.pre.join(' '),
        stats.ino.join(' '),
        stats.post.join(' '),
        [...stats.niveles].reverse().join(' '),
        seq.join(' ')
      ].forEach((c) => {
        if (distSet.size < 4) distSet.add(c);
      });
      while (distSet.size < 4) {
        distSet.add([...stats.niveles].sort(() => Math.random() - 0.5).join(' '));
      }
      out.push(
        createDynamicItem(course, {
          unit: 'u3',
          tag: 'Dinámico U3 · Recorrido ABO',
          q: `Insertando en un ABO vacío la secuencia [${seq.join(', ')}] en ese orden exacto, ¿cuál es su Recorrido por Niveles?`,
          opts: Array.from(distSet),
          ans: 0,
          exp: `Con raíz 50 y regla izq < info <= der: PreOrden=[${stats.pre.join(' ')}], InOrden=[${stats.ino.join(' ')}] y Por Niveles=[${correct}].`
        })
      );
    }
    return out;
  }

  if (course === 'ada') {
    const out: QuizItem[] = [];
    if (unitFilter === 'all' || unitFilter === 'u1') {
      const cases = [
        { a: 4, b: 2, k: 1, ans: 'Θ(n²)', reason: 'a=4 > b^k=2 -> Caso 3: Θ(n^(log₂ 4)) = Θ(n²)' },
        { a: 4, b: 2, k: 2, ans: 'Θ(n² log n)', reason: 'a=4 == b^k=4 -> Caso 2: Θ(n² log n)' },
        { a: 2, b: 2, k: 2, ans: 'Θ(n²)', reason: 'a=2 < b^k=4 -> Caso 1: Θ(n²)' },
        { a: 8, b: 2, k: 2, ans: 'Θ(n³)', reason: 'a=8 > b^k=4 -> Caso 3: Θ(n^(log₂ 8)) = Θ(n³)' }
      ];
      const chosen = cases[Math.floor(Math.random() * cases.length)];
      const dist = ['Θ(n²)', 'Θ(n² log n)', 'Θ(n³)', 'Θ(n log n)']
        .filter((x) => x !== chosen.ans)
        .slice(0, 3);
      out.push(
        createDynamicItem(course, {
          unit: 'u1',
          tag: 'Dinámico · Teorema Maestro',
          q: `Resuelve T(n) = ${chosen.a}·T(n/${chosen.b}) + Θ(n^${chosen.k}):`,
          opts: [chosen.ans, ...dist],
          ans: 0,
          exp: chosen.reason
        })
      );
    }
    if (unitFilter === 'all' || unitFilter === 'u2') {
      const arr = Array.from({ length: 5 }, () => Math.floor(Math.random() * 11) - 4);
      let cur = arr[0];
      let best = arr[0];
      for (let i = 1; i < arr.length; i++) {
        cur = Math.max(arr[i], cur + arr[i]);
        best = Math.max(best, cur);
      }
      out.push(
        createDynamicItem(course, {
          unit: 'u2',
          tag: 'Dinámico · Kadane',
          q: `¿Cuál es la suma máxima contigua de A = [${arr.join(', ')}]?`,
          opts: [`${best}`, `${best + 3}`, `${best - 2}`, `${best + 5}`],
          ans: 0,
          exp: `Ejecutando Kadane sobre [${arr.join(', ')}], el máximo global es ${best}.`
        })
      );
    }
    if (unitFilter === 'all' || unitFilter === 'u3') {
      const fVal = [0.1, 0.2, 0.25, 0.5][Math.floor(Math.random() * 4)];
      const maxS = (1 / fVal).toFixed(1).replace('.0', '');
      const dist = ['2', '4', '5', '10', '8'].filter((x) => x !== maxS).slice(0, 3);
      out.push(
        createDynamicItem(course, {
          unit: 'u3',
          tag: 'Dinámico · Ley de Amdahl',
          q: `Si la parte secuencial de un algoritmo es f = ${fVal}, ¿cuál es su cota superior teórica de aceleración (1/f)?`,
          opts: [`${maxS}x`, ...dist.map((d) => `${d}x`)],
          ans: 0,
          exp: `Por Ley de Amdahl, S_p ≤ 1/f = 1/${fVal} = ${maxS}x.`
        })
      );
    }
    return out;
  }

  const out: QuizItem[] = [];
  if (unitFilter === 'all' || unitFilter === 'u12') {
    const g1 = 2 + Math.floor(Math.random() * 5);
    const h1 = 2 + Math.floor(Math.random() * 5);
    const g2 = g1 + 2;
    const h2 = Math.max(1, h1 - 3);
    const f1 = g1 + h1;
    const f2 = g2 + h2;
    const win =
      f1 < f2
        ? `Nodo P (f=${f1})`
        : f2 < f1
          ? `Nodo Q (f=${f2})`
          : h1 < h2
            ? `Nodo P (empate en f=${f1}, menor h)`
            : `Nodo Q (empate en f=${f2}, menor h)`;
    const lose = win.includes('Nodo P') ? `Nodo Q (f=${f2})` : `Nodo P (f=${f1})`;
    out.push(
      createDynamicItem(course, {
        unit: 'u12',
        tag: 'Dinámico · A*',
        q: `En A*, tienes dos nodos en frontera (desempate por menor h): P con g=${g1}, h=${h1}; y Q con g=${g2}, h=${h2}. ¿Cuál se expande primero?`,
        opts: [win, lose, `El que tenga menor g (g=${g1})`, 'Se expanden ambos en paralelo'],
        ans: 0,
        exp: `f(P)=${g1}+${h1}=${f1} y f(Q)=${g2}+${h2}=${f2}. A* escoge el de menor f(n)=g(n)+h(n) (y en empate, menor h).`
      })
    );

    const cur = 15 + Math.floor(Math.random() * 6);
    const nxt = cur + 2 + Math.floor(Math.random() * 4);
    const temp = 10;
    const delta = nxt - cur;
    const prob = Math.exp(-delta / temp).toFixed(3);
    out.push(
      createDynamicItem(course, {
        unit: 'u12',
        tag: 'Dinámico · Recocido Simulado',
        q: `Minimizando en SA: f(actual)=${cur}, f(nueva)=${nxt}, T=${temp}. ¿Cuánto vale aproximadamente la probabilidad de aceptación e^(-Δ/T)?`,
        opts: [
          prob,
          Math.min(0.99, parseFloat(prob) + 0.25).toFixed(3),
          Math.max(0.05, parseFloat(prob) - 0.25).toFixed(3),
          '1.000'
        ],
        ans: 0,
        exp: `Δ = ${nxt} - ${cur} = ${delta}. Luego e^(-${delta}/${temp}) ≈ ${prob}.`
      })
    );
  }
  if (unitFilter === 'all' || unitFilter === 'u3') {
    const prev = [0.01, 0.02, 0.05][Math.floor(Math.random() * 3)];
    const sens = [0.9, 0.95][Math.floor(Math.random() * 2)];
    const fpr = [0.05, 0.1][Math.floor(Math.random() * 2)];
    const w1 = prev * sens;
    const w2 = (1 - prev) * fpr;
    const post = ((w1 / (w1 + w2)) * 100).toFixed(2);
    out.push(
      createDynamicItem(course, {
        unit: 'u3',
        tag: 'Dinámico · Bayes',
        q: `Con P(H)=${prev}, P(+|H)=${sens} y P(+|¬H)=${fpr}, ¿cuál es P(H | +)?`,
        opts: [
          `${post}%`,
          `${(sens * 100).toFixed(2)}%`,
          `${((1 - fpr) * 100).toFixed(2)}%`,
          `${Math.min(99, parseFloat(post) + 21.4).toFixed(2)}%`
        ],
        ans: 0,
        exp: `w(H)=${w1.toFixed(4)}, w(¬H)=${w2.toFixed(4)} -> P(H|+) = ${w1.toFixed(4)} / ${(w1 + w2).toFixed(4)} = ${post}%.`
      })
    );
  }
  if (unitFilter === 'all' || unitFilter === 'u4') {
    const vp = 40 + Math.floor(Math.random() * 40);
    const fn = 5 + Math.floor(Math.random() * 20);
    const fp = 5 + Math.floor(Math.random() * 20);
    const vn = 40 + Math.floor(Math.random() * 40);
    const rec = ((vp / (vp + fn)) * 100).toFixed(2);
    const prec = ((vp / (vp + fp)) * 100).toFixed(2);
    const acc = (((vp + vn) / (vp + fn + fp + vn)) * 100).toFixed(2);
    const esp = ((vn / (vn + fp)) * 100).toFixed(2);
    out.push(
      createDynamicItem(course, {
        unit: 'u4',
        tag: 'Dinámico · Métricas',
        q: `Con VP=${vp}, FN=${fn}, FP=${fp}, VN=${vn}, ¿cuánto vale la Sensibilidad (Recall)?`,
        opts: [`${rec}%`, `${prec}%`, `${acc}%`, `${esp}%`],
        ans: 0,
        exp: `Sensibilidad = VP / (VP + FN) = ${vp} / ${vp + fn} = ${rec}%.`
      })
    );

    const p = 1 + Math.floor(Math.random() * 4);
    const n = p + 1 + Math.floor(Math.random() * 4);
    const hVal = entropy(p, n);
    out.push(
      createDynamicItem(course, {
        unit: 'u4',
        tag: 'Dinámico · Entropía',
        q: `En un nodo con ${p} 'Sí' y ${n} 'No' (total ${p + n}), ¿cuánto vale H(E)?`,
        opts: [
          `${hVal.toFixed(6)} bits`,
          `${Math.min(1, hVal + 0.12).toFixed(6)} bits`,
          `${Math.max(0.05, hVal - 0.14).toFixed(6)} bits`,
          '1.000000 bits'
        ],
        ans: 0,
        exp: `H = -(${p}/${p + n})log₂(${p}/${p + n}) - (${n}/${p + n})log₂(${n}/${p + n}) = ${hVal.toFixed(6)} bits.`
      })
    );
  }
  return out;
}

/** Synchronizes mistake review button label, disabled state, and clear button visibility. */
function updateMistakeControls(root: HTMLElement, course: CourseId): void {
  const count = loadMistakes()[course].length;
  const reviewBtn = getScopedEl<HTMLButtonElement>(root, `${course}-quiz-review-btn`);
  const clearBtn = getScopedEl<HTMLButtonElement>(root, `${course}-quiz-clear-btn`);

  if (reviewBtn) {
    reviewBtn.textContent = `Repasar errores (${count})`;
    reviewBtn.disabled = count === 0;
    reviewBtn.classList.toggle('has-mistakes', count > 0);
    reviewBtn.classList.toggle('active', activeQuizMode[course] === 'mistakes' && count > 0);
  }

  if (clearBtn) {
    clearBtn.hidden = count === 0;
  }
}

/** Renders a normal 12-question round or a localStorage mistake-review round. */
function renderQuiz(root: HTMLElement, course: CourseId, mode: QuizMode = 'normal'): void {
  const filterEl = getScopedEl<HTMLSelectElement>(root, `${course}-quiz-filter`);
  const scoreEl = getScopedEl<HTMLElement>(root, `${course}-quiz-score`);
  const bannerEl = getScopedEl<HTMLElement>(root, `${course}-quiz-banner`);
  const container = getScopedEl<HTMLElement>(root, `${course}-quiz-container`);
  if (!scoreEl || !container) return;

  activeQuizMode[course] = mode;

  let questions: QuizItem[] = [];
  if (mode === 'mistakes') {
    const saved = loadMistakes()[course];
    if (saved.length === 0) {
      activeQuizMode[course] = 'normal';
      if (bannerEl) {
        bannerEl.classList.add('is-complete');
        bannerEl.textContent = `No tienes errores pendientes en ${course.toUpperCase()}. Inicia una nueva ronda para practicar.`;
        bannerEl.hidden = false;
      }
      scoreEl.textContent = 'Puntaje: 0 / 0';
      container.innerHTML = '';
      updateMistakeControls(root, course);
      return;
    }
    questions = saved;
    if (bannerEl) {
      bannerEl.classList.remove('is-complete');
      bannerEl.textContent = `Modo repaso de errores (${questions.length} pendientes guardados localmente). Al responder correctamente una pregunta se elimina de esta lista.`;
      bannerEl.hidden = false;
    }
  } else {
    if (bannerEl) {
      bannerEl.classList.remove('is-complete');
      bannerEl.hidden = true;
      bannerEl.textContent = '';
    }
    const unitFilter = filterEl ? filterEl.value : 'all';
    const pool = BANKS[course].filter((item) => unitFilter === 'all' || item.unit === unitFilter);
    const dyn = dynamicQuestions(course, unitFilter);
    const maxNonDyn = Math.max(1, 12 - dyn.length);
    const selectedBase = [...pool].sort(() => Math.random() - 0.5).slice(0, maxNonDyn);
    questions = [...selectedBase, ...dyn].sort(() => Math.random() - 0.5).slice(0, 12);
  }

  let score = 0;
  scoreEl.textContent = `Puntaje: 0 / ${questions.length}`;
  container.innerHTML = '';

  questions.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    const shuffledOpts = item.opts
      .map((text, i) => ({ text, ok: i === item.ans }))
      .sort(() => Math.random() - 0.5);

    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-q';
    const tagSpan = document.createElement('span');
    tagSpan.className = 'quiz-tag';
    tagSpan.textContent = item.tag;
    qDiv.appendChild(tagSpan);
    qDiv.appendChild(document.createTextNode(`${idx + 1}. ${item.q}`));

    const optsDiv = document.createElement('div');
    optsDiv.className = 'quiz-opts';
    const expDiv = document.createElement('div');
    expDiv.className = 'quiz-exp';
    expDiv.textContent = item.exp;

    card.appendChild(qDiv);
    card.appendChild(optsDiv);
    card.appendChild(expDiv);

    shuffledOpts.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-opt';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (optsDiv.dataset.answered) return;
        optsDiv.dataset.answered = '1';
        optsDiv.querySelectorAll<HTMLButtonElement>('.quiz-opt').forEach((optionBtn, j) => {
          optionBtn.disabled = true;
          if (shuffledOpts[j]?.ok) optionBtn.classList.add('correct');
        });
        if (opt.ok) {
          score++;
          scoreEl.textContent = `Puntaje: ${score} / ${questions.length}`;
          const remaining = resolveMistake(course, item.id);
          if (activeQuizMode[course] === 'mistakes' && remaining.length === 0 && bannerEl) {
            bannerEl.classList.add('is-complete');
            bannerEl.textContent = 'Lista de errores al día: resolviste todas las preguntas guardadas de este ramo.';
          }
        } else {
          btn.classList.add('wrong');
          recordMistake(course, {
            id: item.id,
            unit: item.unit,
            tag: item.tag,
            q: item.q,
            opts: [...item.opts],
            ans: item.ans,
            exp: item.exp
          });
        }
        updateMistakeControls(root, course);
        expDiv.classList.add('show');
      });
      optsDiv.appendChild(btn);
    });

    container.appendChild(card);
  });

  updateMistakeControls(root, course);
  renderMath(container);
}

const ACTION_HANDLERS: Record<string, (root: HTMLElement) => void> = {
  'simulate-abo': simulateABO,
  'analyze-graph': analyzeAEDGraph,
  'solve-recurrence': solveRecurrence,
  'simulate-kadane': simulateKadane,
  'generate-lcs': generateLCS,
  'calc-dt': calcDecisionTree,
  'calc-cm': calcConfusionMatrix,
  'calc-bayes': calcBayes,
  'calc-sa': calcSA,
  'calc-dist': calcDistances
};

function scrollToEstudiaTop(root: HTMLElement): void {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
}

const SURVEY_DISMISSED_KEY = 'estudia_survey_dismissed_v1';

interface SurveyApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/** Wires the expandable open-ended feedback survey banner to /api/contact. */
function setupSurveyBanner(root: HTMLElement): void {
  const banner = getScopedEl<HTMLElement>(root, 'estudia-survey-banner');
  const toggleBtn = getScopedEl<HTMLButtonElement>(root, 'estudia-survey-toggle');
  const dismissBtn = getScopedEl<HTMLButtonElement>(root, 'estudia-survey-dismiss');
  const panel = getScopedEl<HTMLElement>(root, 'estudia-survey-panel');
  const form = getScopedEl<HTMLFormElement>(root, 'estudia-survey-form');
  const nameInput = getScopedEl<HTMLInputElement>(root, 'estudia-survey-name');
  const emailInput = getScopedEl<HTMLInputElement>(root, 'estudia-survey-email');
  const messageInput = getScopedEl<HTMLTextAreaElement>(root, 'estudia-survey-message');
  const submitBtn = getScopedEl<HTMLButtonElement>(root, 'estudia-survey-submit');
  const statusEl = getScopedEl<HTMLElement>(root, 'estudia-survey-status');

  if (
    !banner ||
    !toggleBtn ||
    !dismissBtn ||
    !panel ||
    !form ||
    !nameInput ||
    !emailInput ||
    !messageInput ||
    !submitBtn ||
    !statusEl
  ) {
    return;
  }

  try {
    if (window.sessionStorage.getItem(SURVEY_DISMISSED_KEY) === '1') {
      banner.hidden = true;
      return;
    }
  } catch {
    // Session storage may be unavailable in restricted contexts.
  }

  const botcheckInput = form.querySelector<HTMLInputElement>('input[name="botcheck"]');
  const submitLabel = submitBtn.querySelector('span');
  let hasSubmitted = false;

  function setExpanded(expanded: boolean): void {
    panel!.hidden = !expanded;
    toggleBtn!.setAttribute('aria-expanded', String(expanded));
    toggleBtn!.textContent = expanded
      ? 'Cerrar'
      : hasSubmitted
        ? 'Enviar otro comentario'
        : 'Responder encuesta';
  }

  function showStatus(kind: 'loading' | 'success' | 'error', text: string): void {
    statusEl!.classList.remove('is-loading', 'is-success', 'is-error');
    statusEl!.classList.add(`is-${kind}`);
    statusEl!.textContent = text;
    statusEl!.hidden = false;
  }

  toggleBtn.addEventListener('click', () => {
    const nextExpanded = panel.hidden;
    setExpanded(nextExpanded);
    if (nextExpanded) {
      if (hasSubmitted) statusEl.hidden = true;
      nameInput.focus();
    }
  });

  dismissBtn.addEventListener('click', () => {
    banner.hidden = true;
    try {
      window.sessionStorage.setItem(SURVEY_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage errors on dismiss.
    }
  });

  panel.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setExpanded(false);
      toggleBtn.focus();
    }
  });

  form.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    const botcheck = botcheckInput?.value ?? '';

    if (name.length < 2) {
      showStatus('error', 'Ingresa tu nombre (al menos 2 caracteres).');
      nameInput.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('error', 'Ingresa un correo electrónico válido.');
      emailInput.focus();
      return;
    }

    if (message.length < 5) {
      showStatus('error', 'Escribe un comentario breve (al menos 5 caracteres).');
      messageInput.focus();
      return;
    }

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Enviando...';
    showStatus('loading', 'Enviando tu respuesta...');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          topic: `Encuesta estudIA (${getCurrentDomRoute(root).hash})`,
          message,
          botcheck
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let data: SurveyApiResponse = {};
      if (contentType.includes('application/json')) {
        const parsed: unknown = await response.json();
        if (typeof parsed === 'object' && parsed !== null) {
          data = parsed as SurveyApiResponse;
        }
      } else {
        const rawText = await response.text();
        data = { error: rawText || 'Respuesta no válida del servidor.' };
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo enviar tu respuesta. Intenta nuevamente.');
      }

      hasSubmitted = true;
      showStatus('success', data.message || '¡Gracias por tu comentario! Quedó registrado.');
      form.reset();
      toggleBtn.textContent = 'Cerrar';
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo enviar tu respuesta. Intenta nuevamente.';
      showStatus('error', errMsg);
    } finally {
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Enviar respuesta';
    }
  });
}

/** Initializes the estudIA hub inside #estudia-root with idempotent event delegation. */
export function initEstudia(): void {
  const root = document.getElementById('estudia-root');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  setupGlobalSearch(root);
  setupSurveyBanner(root);

  root.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const navBtn = target.closest<HTMLButtonElement>('[data-tab]');
    if (navBtn && root.contains(navBtn) && navBtn.dataset.tab) {
      switchTab(root, navBtn.dataset.tab);
      return;
    }

    const jumpBtn = target.closest<HTMLButtonElement>('[data-jump-tab][data-jump-sub]');
    if (jumpBtn && root.contains(jumpBtn)) {
      const tabId = jumpBtn.dataset.jumpTab;
      const subId = jumpBtn.dataset.jumpSub;
      if (tabId && subId) {
        jumpTo(root, tabId, subId, { scrollToTop: true });
      }
      return;
    }

    const subBtn = target.closest<HTMLButtonElement>('[data-sub-parent][data-sub-target]');
    if (subBtn && root.contains(subBtn)) {
      const parentId = subBtn.dataset.subParent;
      const subId = subBtn.dataset.subTarget;
      if (parentId && subId) {
        switchSub(root, parentId, subId);
      }
      return;
    }

    const printBtn = target.closest<HTMLButtonElement>('[data-print-tab][data-print-sub]');
    if (printBtn && root.contains(printBtn)) {
      const tabId = printBtn.dataset.printTab;
      const subId = printBtn.dataset.printSub;
      if (tabId && subId) printCourseTorpedo(root, tabId, subId);
      return;
    }

    const presetBtn = target.closest<HTMLButtonElement>('[data-abo-preset]');
    if (presetBtn && root.contains(presetBtn)) {
      const seq = presetBtn.dataset.aboPreset ?? '';
      const delVal = presetBtn.dataset.aboDel ?? '';
      const mode: DeleteMode = presetBtn.dataset.aboMode === 'f4' ? 'f4' : 'f3';
      setABOPreset(root, seq, delVal, mode);
      return;
    }

    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (actionBtn && root.contains(actionBtn) && actionBtn.dataset.action) {
      const handler = ACTION_HANDLERS[actionBtn.dataset.action];
      if (handler) handler(root);
      return;
    }

    const gradeBtn = target.closest<HTMLButtonElement>('[data-grade-course]');
    if (gradeBtn && root.contains(gradeBtn) && isCourseId(gradeBtn.dataset.gradeCourse)) {
      calcCourseGrade(root, gradeBtn.dataset.gradeCourse);
      return;
    }

    const quizBtn = target.closest<HTMLButtonElement>('[data-quiz-refresh]');
    if (quizBtn && root.contains(quizBtn) && isCourseId(quizBtn.dataset.quizRefresh)) {
      renderQuiz(root, quizBtn.dataset.quizRefresh, 'normal');
      return;
    }

    const reviewBtn = target.closest<HTMLButtonElement>('[data-quiz-review]');
    if (reviewBtn && root.contains(reviewBtn) && isCourseId(reviewBtn.dataset.quizReview)) {
      renderQuiz(root, reviewBtn.dataset.quizReview, 'mistakes');
      return;
    }

    const clearMistakesBtn = target.closest<HTMLButtonElement>('[data-quiz-clear]');
    if (clearMistakesBtn && root.contains(clearMistakesBtn) && isCourseId(clearMistakesBtn.dataset.quizClear)) {
      const course = clearMistakesBtn.dataset.quizClear;
      clearMistakes(course);
      updateMistakeControls(root, course);
      if (activeQuizMode[course] === 'mistakes') {
        renderQuiz(root, course, 'normal');
      }
    }
  });

  root.addEventListener('change', (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const selectEl = target.closest<HTMLSelectElement>('select');
    if (!selectEl || !root.contains(selectEl)) return;

    if (selectEl.dataset.changeAction === 'graph-preset') {
      loadGraphPreset(root);
      return;
    }

    if (isCourseId(selectEl.dataset.quizFilter)) {
      renderQuiz(root, selectEl.dataset.quizFilter, 'normal');
    }
  });

  renderMath(root);
  calcCourseGrade(root, 'aed');
  calcCourseGrade(root, 'ada');
  calcCourseGrade(root, 'ia');
  simulateABO(root);
  analyzeAEDGraph(root);
  solveRecurrence(root);
  simulateKadane(root);
  generateLCS(root);
  calcDecisionTree(root);
  calcConfusionMatrix(root);
  calcBayes(root);
  calcSA(root);
  calcDistances(root);
  renderQuiz(root, 'aed', 'normal');
  renderQuiz(root, 'ada', 'normal');
  renderQuiz(root, 'ia', 'normal');
  updateMistakeControls(root, 'aed');
  updateMistakeControls(root, 'ada');
  updateMistakeControls(root, 'ia');
  applyEstudiaRoute(root, resolveEstudiaHash(window.location.hash));
}

function readHistoryScroll(state: unknown): { x: number; y: number } | null {
  if (typeof state !== 'object' || state === null) return null;
  const candidate = state as { scrollX?: unknown; scrollY?: unknown };
  if (typeof candidate.scrollY !== 'number' || !Number.isFinite(candidate.scrollY)) return null;
  const x = typeof candidate.scrollX === 'number' && Number.isFinite(candidate.scrollX) ? candidate.scrollX : 0;
  return { x, y: candidate.scrollY };
}

/** Synchronizes active view and optional scroll position on browser Back/Forward or hash changes. */
function syncEstudiaFromLocation(restoreScroll: boolean): void {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  if (normalizedPath !== '/lab/estudia') return;

  const root = document.getElementById('estudia-root');
  if (!root || root.dataset.initialized !== 'true') return;

  applyEstudiaRoute(root, resolveEstudiaHash(window.location.hash));

  if (restoreScroll) {
    const savedScroll = readHistoryScroll(window.history.state);
    if (savedScroll) {
      window.scrollTo({ left: savedScroll.x, top: savedScroll.y, behavior: 'instant' });
    }
  }
}

initEstudia();
document.addEventListener('astro:page-load', initEstudia);
window.addEventListener('popstate', () => syncEstudiaFromLocation(true));
window.addEventListener('hashchange', () => syncEstudiaFromLocation(false));
