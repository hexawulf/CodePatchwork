--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Ubuntu 17.5-0ubuntu0.25.04.1)
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-0ubuntu0.25.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: collectionItems; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public."collectionItems" (
    id integer NOT NULL,
    collectionid integer NOT NULL,
    snippetid integer NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."collectionItems" OWNER TO codepatchwork_user;

--
-- Name: collectionItems_id_seq; Type: SEQUENCE; Schema: public; Owner: codepatchwork_user
--

CREATE SEQUENCE public."collectionItems_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."collectionItems_id_seq" OWNER TO codepatchwork_user;

--
-- Name: collectionItems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: codepatchwork_user
--

ALTER SEQUENCE public."collectionItems_id_seq" OWNED BY public."collectionItems".id;


--
-- Name: collections; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public.collections (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    userid character varying,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.collections OWNER TO codepatchwork_user;

--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: codepatchwork_user
--

CREATE SEQUENCE public.collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collections_id_seq OWNER TO codepatchwork_user;

--
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: codepatchwork_user
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    snippetid integer NOT NULL,
    userid character varying,
    content text NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO codepatchwork_user;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: codepatchwork_user
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO codepatchwork_user;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: codepatchwork_user
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO codepatchwork_user;

--
-- Name: snippets; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public.snippets (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    code text NOT NULL,
    language character varying,
    tags text[],
    userid character varying,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    viewcount integer DEFAULT 0,
    isfavorite boolean DEFAULT false,
    shareid character varying,
    ispublic boolean DEFAULT false
);


ALTER TABLE public.snippets OWNER TO codepatchwork_user;

--
-- Name: snippets_id_seq; Type: SEQUENCE; Schema: public; Owner: codepatchwork_user
--

CREATE SEQUENCE public.snippets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.snippets_id_seq OWNER TO codepatchwork_user;

--
-- Name: snippets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: codepatchwork_user
--

ALTER SEQUENCE public.snippets_id_seq OWNED BY public.snippets.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying NOT NULL,
    count integer DEFAULT 1
);


ALTER TABLE public.tags OWNER TO codepatchwork_user;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: codepatchwork_user
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO codepatchwork_user;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: codepatchwork_user
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: codepatchwork_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email character varying,
    display_name character varying,
    photo_url character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO codepatchwork_user;

--
-- Name: collectionItems id; Type: DEFAULT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public."collectionItems" ALTER COLUMN id SET DEFAULT nextval('public."collectionItems_id_seq"'::regclass);


--
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: snippets id; Type: DEFAULT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.snippets ALTER COLUMN id SET DEFAULT nextval('public.snippets_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Data for Name: collectionItems; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public."collectionItems" (id, collectionid, snippetid, createdat) FROM stdin;
\.


--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public.collections (id, name, description, userid, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public.comments (id, snippetid, userid, content, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: snippets; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public.snippets (id, title, description, code, language, tags, userid, createdat, updatedat, viewcount, isfavorite, shareid, ispublic) FROM stdin;
1000	Test Direct Insert	Testing direct database insertion	console.log("Hello from direct insert");	javascript	{test,direct-insert}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-21 08:32:36.923858+08	2025-05-21 08:32:36.923858+08	0	f	\N	f
1001	Auto ID Test	Testing auto increment after sequence reset	console.log("Testing auto ID assignment");	javascript	{test,sequence}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-21 08:34:12.519156+08	2025-05-21 08:34:12.519156+08	0	f	\N	f
1039	Delete File	Deletes a file from the file system.	File f = new File("delete_me.txt");\nf.delete();	java	{file,delete,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.283129+08	2025-05-23 07:59:25.283129+08	0	f	\N	f
1040	Platform-Independent Path Separator	Constructs a path string using the OS-specific separator.	String path = "folder" + File.separator + "file.txt";	java	{file,separator,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.284554+08	2025-05-23 07:59:25.284554+08	0	f	\N	f
1041	Read Binary File	Reads a binary file byte-by-byte using FileInputStream.	FileInputStream fis = new FileInputStream("binary.dat");\nint b;\nwhile ((b = fis.read()) != -1) {\n  System.out.print((char) b);\n}\nfis.close();	java	{filestream,binary,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.285917+08	2025-05-23 07:59:25.285917+08	0	f	\N	f
1005	Java Deep Clone Example	Illustrates how to perform a deep clone of an object using the Cloneable interface	class Address implements Cloneable {\n    String city;\n\n    Address(String city) {\n        this.city = city;\n    }\n\n    @Override\n    protected Object clone() throws CloneNotSupportedException {\n        return new Address(this.city);\n    }\n}\n\nclass Person implements Cloneable {\n    String name;\n    Address address;\n\n    Person(String name, Address address) {\n        this.name = name;\n        this.address = address;\n    }\n\n    @Override\n    protected Object clone() throws CloneNotSupportedException {\n        Person cloned = (Person) super.clone();\n        cloned.address = (Address) address.clone(); // Deep copy\n        return cloned;\n    }\n\n    public static void main(String[] args) throws CloneNotSupportedException {\n        Address addr = new Address("Berlin");\n        Person original = new Person("Alice", addr);\n        Person clone = (Person) original.clone();\n\n        clone.address.city = "Munich";\n\n        System.out.println("Original city: " + original.address.city);\n        System.out.println("Cloned city: " + clone.address.city);\n    }\n}	java	{java,clone,deepcopy,object,oop}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-21 15:39:34.60282+08	2025-05-21 15:39:34.60282+08	0	f	\N	f
1006	Java Stream API Filter and Map	Example showing how to filter a list and transform its elements using Java Stream API.	import java.util.Arrays;\\nimport java.util.List;\\nimport java.util.stream.Collectors;\\n\\npublic class StreamExample {\\n    public static void main(String[] args) {\\n        List<String> names = Arrays.asList(\\"John\\", \\"Jane\\", \\"Adam\\", \\"Alice\\", \\"Bob\\");\\n        \\n        // Filter names starting with 'A' and convert to uppercase\\n        List<String> filteredNames = names.stream()\\n            .filter(name -> name.startsWith(\\"A\\"))\\n            .map(String::toUpperCase)\\n            .collect(Collectors.toList());\\n        \\n        // Print the result\\n        System.out.println(\\"Names starting with 'A': \\" + filteredNames);\\n    }\\n}	java	{java,streams,functional}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-21 17:13:44.708085+08	2025-05-21 17:13:44.708085+08	0	f	\N	f
1042	Write Binary File	Writes bytes to a binary file using FileOutputStream.	FileOutputStream fos = new FileOutputStream("output.bin");\nfos.write(new byte[]{65, 66, 67});\nfos.close();	java	{filestream,binary,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.287262+08	2025-05-23 07:59:25.287262+08	0	f	\N	f
1012	Using HashSet	Shows how duplicates are not allowed in a HashSet.	HashSet<Integer> set = new HashSet<>();\nset.add(1);\nset.add(2);\nset.add(1);\nSystem.out.println(set);	java	{hashset,sets,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.209795+08	2025-05-23 07:57:33.209795+08	0	f	\N	f
1013	TreeSet Sorted Order	Inserts values in a TreeSet to show automatic sorting.	TreeSet<String> ts = new TreeSet<>();\nts.add("banana");\nts.add("apple");\nSystem.out.println(ts);	java	{treeset,sets,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.211336+08	2025-05-23 07:57:33.211336+08	0	f	\N	f
1043	Buffered Writer Example	Writes a line using BufferedWriter to optimize IO.	BufferedWriter bw = new BufferedWriter(new FileWriter("buffered.txt"));\nbw.write("Buffered line");\nbw.newLine();\nbw.close();	java	{file,bufferedwriter,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.288681+08	2025-05-23 07:59:25.288681+08	0	f	\N	f
1044	Buffered Reader Example	Reads a single line using BufferedReader.	BufferedReader br = new BufferedReader(new FileReader("buffered.txt"));\nSystem.out.println(br.readLine());\nbr.close();	java	{file,bufferedreader,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.290035+08	2025-05-23 07:59:25.290035+08	0	f	\N	f
1045	Compress File with GZIP	Compresses a string to a .gz file using GZIPOutputStream.	GZIPOutputStream gos = new GZIPOutputStream(new FileOutputStream("file.gz"));\ngos.write("Hello".getBytes());\ngos.close();	java	{gzip,compress,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.291382+08	2025-05-23 07:59:25.291382+08	0	f	\N	f
1046	Decompress GZIP File	Reads and decompresses a .gz file using GZIPInputStream.	GZIPInputStream gis = new GZIPInputStream(new FileInputStream("file.gz"));\nint data;\nwhile ((data = gis.read()) != -1) {\n  System.out.print((char) data);\n}\ngis.close();	java	{gzip,decompress,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.292737+08	2025-05-23 07:59:25.292737+08	0	f	\N	f
1047	Try-with-Resources for File Handling	Uses try-with-resources for automatic closing of streams.	try (BufferedReader br = new BufferedReader(new FileReader("sample.txt"))) {\n  System.out.println(br.readLine());\n} catch (IOException e) {\n  e.printStackTrace();\n}	java	{try,resources,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.294059+08	2025-05-23 08:00:18.490287+08	0	t	\N	f
1074	Replace Characters	Replaces underscores with spaces in a string.	String cleaned = "Hello_World".replace('_', ' ');	java	{string,replace,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.425456+08	2025-05-23 08:16:44.425456+08	0	f	\N	f
1075	Compare Strings (Case-Insensitive)	Compares two strings ignoring case.	System.out.println("hello".equalsIgnoreCase("HELLO"));	java	{string,compare,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.426905+08	2025-05-23 08:16:44.426905+08	0	f	\N	f
1076	Split CSV Line	Splits a CSV line into an array of values.	String line = ""Apple","Banana","Cherry"";\nString[] fruits = line.replaceAll("\\"", "").split(",");	java	{string,split,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.428456+08	2025-05-23 08:16:44.428456+08	0	f	\N	f
1	React useLocalStorage Hook	Custom React hook to persist state in localStorage with type safety.	import { useState, useEffect } from 'react';\\n\\nfunction useLocalStorage<T>(\\n  key: string, \\n  initialValue: T\\n): [T, (value: T) => void] {\\n  // Get stored value\\n  const readValue = (): T => {\\n    if (typeof window === 'undefined') {\\n      return initialValue;\\n    }\\n    try {\\n      const item = window.localStorage.getItem(key);\\n      return item ? JSON.parse(item) : initialValue;\\n    } catch (error) {\\n      console.warn('Error reading localStorage key', error);\\n      return initialValue;\\n    }\\n  };\\n  \\n  const [storedValue, setStoredValue] = useState<T>(readValue);\\n  \\n  // Return a wrapped version of useState's setter\\n  const setValue = (value: T) => {\\n    try {\\n      // Save state\\n      setStoredValue(value);\\n      // Save to localStorage\\n      window.localStorage.setItem(key, JSON.stringify(value));\\n    } catch (error) {\\n      console.warn('Error setting localStorage key', error);\\n    }\\n  };\\n\\n  useEffect(() => {\\n    setStoredValue(readValue());\\n  // eslint-disable-next-line react-hooks/exhaustive-deps\\n  }, []);\\n\\n  return [storedValue, setValue];\\n}	tsx	{react,hooks,typescript}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-16 16:51:32.268+08	2025-05-16 16:51:32.268+08	12	f	\N	f
2	Python Decorator for Timing	A simple Python decorator to measure and log function execution time.	import time\\nimport functools\\nimport logging\\n\\ndef timer(func):\\n    \\"\\"\\"Print the runtime of the decorated function\\"\\"\\"\\n    @functools.wraps(func)\\n    def wrapper_timer(*args, **kwargs):\\n        start_time = time.perf_counter()\\n        value = func(*args, **kwargs)\\n        end_time = time.perf_counter()\\n        run_time = end_time - start_time\\n        logging.info(f\\"Completed {func.__name__!r} in {run_time:.4f} secs\\")\\n        return value\\n    return wrapper_timer\\n\\n# Example usage\\n@timer\\ndef waste_some_time(num_times):\\n    for _ in range(num_times):\\n        sum([i**2 for i in range(10000)])\\n        \\n# Call it\\nwaste_some_time(100)	python	{python,decorators,performance}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-16 16:51:32.268+08	2025-05-16 16:51:32.268+08	24	f	\N	f
3	CSS Grid Layout Template	Responsive grid layout with areas for header, sidebar, content and footer.	.grid-container {\\n  display: grid;\\n  grid-template-columns: repeat(12, 1fr);\\n  grid-template-rows: auto 1fr auto;\\n  grid-template-areas:\\n    \\"h h h h h h h h h h h h\\"\\n    \\"s s c c c c c c c c c c\\"\\n    \\"f f f f f f f f f f f f\\";\\n  min-height: 100vh;\\n  gap: 1rem;\\n}\\n\\n.header { grid-area: h; }\\n.sidebar { grid-area: s; }\\n.content { grid-area: c; }\\n.footer { grid-area: f; }\\n\\n/* Tablet layout */\\n@media (max-width: 992px) {\\n  .grid-container {\\n    grid-template-areas:\\n      \\"h h h h h h h h h h h h\\"\\n      \\"s s s s c c c c c c c c\\"\\n      \\"f f f f f f f f f f f f\\";\\n  }\\n}\\n\\n/* Mobile layout */\\n@media (max-width: 768px) {\\n  .grid-container {\\n    grid-template-areas:\\n      \\"h h h h h h h h h h h h\\"\\n      \\"c c c c c c c c c c c c\\"\\n      \\"s s s s s s s s s s s s\\"\\n      \\"f f f f f f f f f f f f\\";\\n  }\\n}	css	{css,grid,responsive}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-16 16:51:32.268+08	2025-05-16 16:51:32.268+08	41	t	\N	f
1008	Create and Access Array	Initializes a simple integer array and accesses the second element.	int[] numbers = {10, 20, 30};\nSystem.out.println(numbers[1]);	java	{arrays,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.201856+08	2025-05-23 07:57:33.201856+08	0	f	\N	f
1009	Iterate Array with For Loop	Uses a standard for loop to iterate through an array.	for (int i = 0; i < numbers.length; i++) {\n  System.out.println(numbers[i]);\n}	java	{arrays,loops,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.20457+08	2025-05-23 07:57:33.20457+08	0	f	\N	f
1010	ArrayList Basic Operations	Creates an ArrayList, adds elements, and accesses the first item.	ArrayList<String> list = new ArrayList<>();\nlist.add("Apple");\nlist.add("Banana");\nSystem.out.println(list.get(0));	java	{arraylist,lists,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.20612+08	2025-05-23 07:57:33.20612+08	0	f	\N	f
1011	LinkedList as List	Demonstrates a LinkedList used as a list.	LinkedList<String> cities = new LinkedList<>();\ncities.add("Berlin");\ncities.add("Munich");	java	{linkedlist,lists,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.208232+08	2025-05-23 07:57:33.208232+08	0	f	\N	f
1014	HashMap Key-Value Store	Stores key-value pairs and retrieves a value using a key.	HashMap<String, Integer> scores = new HashMap<>();\nscores.put("Alice", 90);\nscores.put("Bob", 80);\nSystem.out.println(scores.get("Alice"));	java	{hashmap,maps,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.212849+08	2025-05-23 07:57:33.212849+08	0	f	\N	f
1015	TreeMap Sorted Keys	TreeMap automatically sorts keys.	TreeMap<Integer, String> map = new TreeMap<>();\nmap.put(2, "B");\nmap.put(1, "A");\nSystem.out.println(map);	java	{treemap,maps,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.214931+08	2025-05-23 07:57:33.214931+08	0	f	\N	f
1016	Stack Push and Pop	Simulates a stack with push and pop using ArrayDeque.	Deque<Integer> stack = new ArrayDeque<>();\nstack.push(10);\nstack.push(20);\nSystem.out.println(stack.pop());	java	{stack,deque,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.216362+08	2025-05-23 07:57:33.216362+08	0	f	\N	f
1017	Queue Operations	Shows basic FIFO queue behavior using LinkedList.	Queue<String> queue = new LinkedList<>();\nqueue.add("first");\nqueue.add("second");\nSystem.out.println(queue.remove());	java	{queue,linkedlist,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.219071+08	2025-05-23 07:57:33.219071+08	0	f	\N	f
1018	Iterator Example	Demonstrates use of an Iterator on a List.	Iterator<String> it = list.iterator();\nwhile(it.hasNext()) {\n  System.out.println(it.next());\n}	java	{iterator,collections,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.220773+08	2025-05-23 07:57:33.220773+08	0	f	\N	f
1019	Extended For Loop	Uses enhanced for loop to iterate over a collection.	for(String item : list) {\n  System.out.println(item);\n}	java	{for-each,loop,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.222278+08	2025-05-23 07:57:33.222278+08	0	f	\N	f
1020	Set Operations	Performs set intersection using retainAll.	Set<String> set1 = new HashSet<>(List.of("a", "b"));\nSet<String> set2 = new HashSet<>(List.of("b", "c"));\nset1.retainAll(set2);\nSystem.out.println(set1);	java	{sets,hashset,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.223735+08	2025-05-23 07:57:33.223735+08	0	f	\N	f
1021	Map Entry Iteration	Iterates through a map’s key-value pairs.	for (Map.Entry<String, Integer> entry : scores.entrySet()) {\n  System.out.println(entry.getKey() + ": " + entry.getValue());\n}	java	{map,iteration,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.225182+08	2025-05-23 07:57:33.225182+08	0	f	\N	f
1022	Multi-dimensional Array	Accesses an element from a 2D array.	int[][] matrix = {{1, 2}, {3, 4}};\nSystem.out.println(matrix[1][0]);	java	{array,2d,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.226667+08	2025-05-23 07:57:33.226667+08	0	f	\N	f
1023	Check if Collection is Empty	Checks whether a collection is empty using isEmpty().	if (list.isEmpty()) {\n  System.out.println("List is empty");\n}	java	{collections,check,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.22807+08	2025-05-23 07:57:33.22807+08	0	f	\N	f
1024	Map Default Value	Uses getOrDefault to avoid null for missing keys.	int value = scores.getOrDefault("Carol", 0);\nSystem.out.println(value);	java	{map,default,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.229462+08	2025-05-23 07:57:33.229462+08	0	f	\N	f
1025	Deque as Queue	Uses offer and poll to simulate queue operations with Deque.	Deque<String> deque = new ArrayDeque<>();\ndeque.offer("first");\ndeque.offer("second");\nSystem.out.println(deque.poll());	java	{queue,deque,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.231046+08	2025-05-23 07:57:33.231046+08	0	f	\N	f
1026	Remove from List by Index	Removes an element at index 1 from a list.	list.remove(1);	java	{list,remove,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.232745+08	2025-05-23 07:57:33.232745+08	0	f	\N	f
1027	Check Set Contains Element	Checks if a set contains a specific element.	System.out.println(set.contains("banana"));	java	{set,contains,unit4}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:57:33.234356+08	2025-05-23 07:57:33.234356+08	0	f	\N	f
1028	Check File Exists	Checks if the file 'data.txt' exists in the current directory.	File file = new File("data.txt");\nSystem.out.println(file.exists());	java	{file,check,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.264632+08	2025-05-23 07:59:25.264632+08	0	f	\N	f
1029	Create New Directory	Creates a single new directory named 'mydir'.	File dir = new File("mydir");\ndir.mkdir();	java	{file,directory,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.266643+08	2025-05-23 07:59:25.266643+08	0	f	\N	f
1030	Create Nested Directories	Creates a nested directory structure.	File dirs = new File("a/b/c");\ndirs.mkdirs();	java	{file,mkdirs,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.26815+08	2025-05-23 07:59:25.26815+08	0	f	\N	f
1031	List Files in Directory	Lists all files and folders in the current directory.	File folder = new File(".");\nFile[] files = folder.listFiles();\nfor (File f : files) {\n  System.out.println(f.getName());\n}	java	{file,list,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.269618+08	2025-05-23 07:59:25.269618+08	0	f	\N	f
1032	Rename or Move File	Renames or moves a file using renameTo().	File oldFile = new File("old.txt");\nFile newFile = new File("new.txt");\noldFile.renameTo(newFile);	java	{file,rename,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.271116+08	2025-05-23 07:59:25.271116+08	0	f	\N	f
1033	Write to File	Writes a string to a file using FileWriter.	FileWriter writer = new FileWriter("output.txt");\nwriter.write("Hello, file!");\nwriter.close();	java	{filewriter,write,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.27261+08	2025-05-23 07:59:25.27261+08	0	f	\N	f
1034	Read Text File Line-by-Line	Reads each line of a text file using BufferedReader.	BufferedReader reader = new BufferedReader(new FileReader("input.txt"));\nString line;\nwhile ((line = reader.readLine()) != null) {\n  System.out.println(line);\n}\nreader.close();	java	{filereader,read,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.275448+08	2025-05-23 07:59:25.275448+08	0	f	\N	f
1035	Copy File Content	Copies text from one file to another line-by-line.	BufferedReader in = new BufferedReader(new FileReader("input.txt"));\nBufferedWriter out = new BufferedWriter(new FileWriter("copy.txt"));\nString line;\nwhile ((line = in.readLine()) != null) {\n  out.write(line);\n  out.newLine();\n}\nin.close();\nout.close();	java	{file,copy,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.277375+08	2025-05-23 07:59:25.277375+08	0	f	\N	f
1036	Check if File is Directory	Checks whether the file object points to a directory.	File f = new File("mydir");\nSystem.out.println(f.isDirectory());	java	{file,isDirectory,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.278943+08	2025-05-23 07:59:25.278943+08	0	f	\N	f
1037	Get File Size	Returns the size of a file in bytes.	File f = new File("example.txt");\nSystem.out.println(f.length() + " bytes");	java	{file,size,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.280375+08	2025-05-23 07:59:25.280375+08	0	f	\N	f
1038	Check File Permissions	Checks if a file is readable and writable.	File f = new File("test.txt");\nSystem.out.println(f.canRead());\nSystem.out.println(f.canWrite());	java	{file,permissions,unit6}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 07:59:25.281767+08	2025-05-23 07:59:25.281767+08	0	f	\N	f
1048	Override toString() Method	Overrides the toString() method to customize object output.	public class Book {\n  String title = "Java";\n  public String toString() {\n    return "Book Title: " + title;\n  }\n}	java	{object,tostring,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.321338+08	2025-05-23 08:16:03.321338+08	0	f	\N	f
1049	Use toString() Implicitly	Demonstrates implicit toString() call when printing an object.	Book b = new Book();\nSystem.out.println(b);	java	{object,tostring,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.324601+08	2025-05-23 08:16:03.324601+08	0	f	\N	f
1050	Compare with == (Identity)	Compares object references with == (should return false).	String a = new String("Hello");\nString b = new String("Hello");\nSystem.out.println(a == b);	java	{object,compare,identity,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.326059+08	2025-05-23 08:16:03.326059+08	0	f	\N	f
1051	Compare with equals()	Compares object content using equals() (should return true).	System.out.println(a.equals(b));	java	{object,equals,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.327431+08	2025-05-23 08:16:03.327431+08	0	f	\N	f
1052	Override equals() Method	Custom equals method comparing content.	public boolean equals(Object obj) {\n  if (this == obj) return true;\n  if (!(obj instanceof Book)) return false;\n  Book b = (Book) obj;\n  return this.title.equals(b.title);\n}	java	{object,equals,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.328735+08	2025-05-23 08:16:03.328735+08	0	f	\N	f
1053	Override hashCode() Method	Generates hashCode aligned with equals().	public int hashCode() {\n  return title.hashCode();\n}	java	{object,hashcode,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.330068+08	2025-05-23 08:16:03.330068+08	0	f	\N	f
1054	Compare Objects with hashCode()	Prints hash codes to check object identity via content.	System.out.println(a.hashCode());\nSystem.out.println(b.hashCode());	java	{object,hashcode,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.331346+08	2025-05-23 08:16:03.331346+08	0	f	\N	f
1055	Use compareTo() for Ordering	Implements compareTo for sorting Book objects alphabetically.	public int compareTo(Book other) {\n  return this.title.compareTo(other.title);\n}	java	{object,compareto,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.332647+08	2025-05-23 08:16:03.332647+08	0	f	\N	f
1056	CompareTo Return Values	Returns negative, zero, or positive based on order.	System.out.println(b1.compareTo(b2));	java	{object,compareto,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.333934+08	2025-05-23 08:16:03.333934+08	0	f	\N	f
1057	Implement Comparable Interface	Implements Comparable for ordering custom objects.	public class Book implements Comparable<Book> {\n  String title;\n  public int compareTo(Book b) {\n    return this.title.compareTo(b.title);\n  }\n}	java	{comparable,compareto,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.335189+08	2025-05-23 08:16:03.335189+08	0	f	\N	f
1058	Call clone() with Cloneable	Implements clone() with Cloneable interface.	public class Book implements Cloneable {\n  public Object clone() throws CloneNotSupportedException {\n    return super.clone();\n  }\n}	java	{object,clone,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.336523+08	2025-05-23 08:16:03.336523+08	0	f	\N	f
1059	Create Shallow Copy	Clones an object using the overridden clone() method.	Book b2 = (Book) b1.clone();	java	{object,clone,shallow,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.337782+08	2025-05-23 08:16:03.337782+08	0	f	\N	f
1060	Check equals Reflexive	Verifies reflexivity of equals() method.	System.out.println(b1.equals(b1)); // should be true	java	{equals,reflexive,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.339087+08	2025-05-23 08:16:03.339087+08	0	f	\N	f
1061	Check equals Symmetric	Tests symmetry of equals() implementation.	System.out.println(b1.equals(b2));\nSystem.out.println(b2.equals(b1));	java	{equals,symmetric,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.340391+08	2025-05-23 08:16:03.340391+08	0	f	\N	f
1062	Check equals Transitive	Tests transitivity of equals() for three objects.	System.out.println(b1.equals(b2) && b2.equals(b3) && b1.equals(b3));	java	{equals,transitive,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.341683+08	2025-05-23 08:16:03.341683+08	0	f	\N	f
1063	Check equals with null	Ensures equals returns false when compared to null.	System.out.println(b1.equals(null)); // should be false	java	{equals,"null",unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.343124+08	2025-05-23 08:16:03.343124+08	0	f	\N	f
1064	Call toString() Explicitly	Calls toString() explicitly for formatted string output.	System.out.println(b.toString());	java	{object,tostring,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.344644+08	2025-05-23 08:16:03.344644+08	0	f	\N	f
1065	Custom toString() Format	Formats output with custom brackets.	public String toString() {\n  return "[Title: " + title + "]";\n}	java	{tostring,custom,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.346062+08	2025-05-23 08:16:03.346062+08	0	f	\N	f
1066	Deep Copy Hint	Comment hint for implementing deep copy instead of shallow.	// Deep copy requires cloning referenced objects manually.	java	{clone,deep,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.347527+08	2025-05-23 08:16:03.347527+08	0	f	\N	f
1067	Compare Wrapper Objects	Shows behavior of == with wrapper class caching.	Integer a = 100;\nInteger b = 100;\nSystem.out.println(a == b); // true due to caching	java	{compare,wrapper,unit2}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:03.349164+08	2025-05-23 08:16:03.349164+08	0	f	\N	f
1068	String Literal Declaration	Declares and initializes a string using literal syntax.	String greeting = "Hello, Java!";	java	{string,literal,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.416772+08	2025-05-23 08:16:44.416772+08	0	f	\N	f
1069	Concatenate Strings	Joins multiple strings using the + operator.	String fullName = "John" + " " + "Doe";	java	{string,concatenation,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.418712+08	2025-05-23 08:16:44.418712+08	0	f	\N	f
1070	Convert int to String	Converts an integer to a string using valueOf().	String numberStr = String.valueOf(123);	java	{string,conversion,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.420083+08	2025-05-23 08:16:44.420083+08	0	f	\N	f
1071	Convert String to int	Parses an integer value from a string.	int number = Integer.parseInt("123");	java	{string,parsing,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.421445+08	2025-05-23 08:16:44.421445+08	0	f	\N	f
1072	Check String Contains	Checks if a substring exists within a string.	System.out.println("Java Programming".contains("gram"));	java	{string,contains,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.422808+08	2025-05-23 08:16:44.422808+08	0	f	\N	f
1073	Get Substring	Extracts a substring from the string.	String name = "Johnathan";\nSystem.out.println(name.substring(0, 4));	java	{string,substring,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.42409+08	2025-05-23 08:16:44.42409+08	0	f	\N	f
1077	StringBuffer Append	Appends strings using StringBuffer for performance.	StringBuffer sb = new StringBuffer();\nsb.append("Hello");\nsb.append(" World");\nSystem.out.println(sb.toString());	java	{stringbuffer,append,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.42982+08	2025-05-23 08:16:44.42982+08	0	f	\N	f
1078	Trim Whitespace	Removes leading and trailing whitespace from a string.	String input = "  padded  ";\nSystem.out.println(input.trim());	java	{string,trim,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.431378+08	2025-05-23 08:16:44.431378+08	0	f	\N	f
1079	Create Current Date	Creates a Date object representing the current moment.	Date now = new Date();\nSystem.out.println(now);	java	{date,current,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.432939+08	2025-05-23 08:16:44.432939+08	0	f	\N	f
1080	Format Date	Formats the current date in German style.	SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy");\nString formatted = sdf.format(new Date());\nSystem.out.println(formatted);	java	{date,format,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.434376+08	2025-05-23 08:16:44.434376+08	0	f	\N	f
1081	Parse Date from String	Parses a date string into a Date object.	SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");\nDate d = sdf.parse("2025-05-23");	java	{date,parse,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.435832+08	2025-05-23 08:16:44.435832+08	0	f	\N	f
1082	Check Date Order	Compares two dates to check chronological order.	Date earlier = sdf.parse("2020-01-01");\nDate later = new Date();\nSystem.out.println(earlier.before(later));	java	{date,compare,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.437176+08	2025-05-23 08:16:44.437176+08	0	f	\N	f
1083	Use GregorianCalendar	Creates a GregorianCalendar for a specific date.	Calendar cal = new GregorianCalendar(2025, Calendar.MAY, 23);\nSystem.out.println(cal.getTime());	java	{calendar,gregorian,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.438526+08	2025-05-23 08:16:44.438526+08	0	f	\N	f
1084	Roll Calendar Date	Rolls the calendar forward by one month.	cal.roll(Calendar.MONTH, 1);\nSystem.out.println(cal.getTime());	java	{calendar,roll,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.440895+08	2025-05-23 08:16:44.440895+08	0	f	\N	f
1085	Get Calendar Field	Extracts the year from a Calendar instance.	int year = cal.get(Calendar.YEAR);\nSystem.out.println("Year: " + year);	java	{calendar,get,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.442459+08	2025-05-23 08:16:44.442459+08	0	f	\N	f
1086	Set Calendar Field	Sets a specific day in a Calendar object.	cal.set(Calendar.DAY_OF_MONTH, 15);\nSystem.out.println(cal.getTime());	java	{calendar,set,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.443856+08	2025-05-23 08:16:44.443856+08	0	f	\N	f
1087	Format with DateFormat.SHORT	Formats a date using a predefined short format.	DateFormat df = DateFormat.getDateInstance(DateFormat.SHORT);\nSystem.out.println(df.format(new Date()));	java	{dateformat,short,unit5}	rSH4fsZZboZhREcZjnwjOTkxit02	2025-05-23 08:16:44.445158+08	2025-05-23 08:16:44.445158+08	0	f	\N	f
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public.tags (id, name, count) FROM stdin;
1	typescript	1
2	css	1
3	python	1
4	hooks	1
5	responsive	1
6	grid	1
7	decorators	1
8	performance	1
9	react	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: codepatchwork_user
--

COPY public.users (id, email, display_name, photo_url, created_at, updated_at) FROM stdin;
T2VGNpXA0CTxChHJbFBp7GfhYUl2	zkai8790@gmail.com	張愷恩	https://lh3.googleusercontent.com/a/ACg8ocJ5myoc01U_tdg7cSutam1CBmfZPGL3jVz_rMQI20RZcSOFZxr9=s96-c	2025-05-20 07:50:53.611165+08	2025-05-20 19:29:38.979+08
U0vTskMoAfextb67hjU3yVdpx273	randomork3@gmail.com	Random Ork	https://lh3.googleusercontent.com/a/ACg8ocI2sqIbZiMTq80e2WH1HLFzvHzsq4VQ064pYgE5pMDNouHlf3W3rw=s96-c	2025-05-20 21:18:35.391743+08	2025-05-20 22:20:26.667+08
rSH4fsZZboZhREcZjnwjOTkxit02	hex316aa@gmail.com	Erling Wulf Weinreich	https://lh3.googleusercontent.com/a/ACg8ocItsHJMo2sJnkzRkAgfPJvr5lvnfAv-rrC7Yx8B187u2eLsElCO=s96-c	2025-05-20 07:26:10.504186+08	2025-05-23 08:30:50.995+08
IfA9Mk31L2anZKqVFesYUmWwD9s2	hexawulf@gmail.com	Erling Wulf Weinreich	https://lh3.googleusercontent.com/a/ACg8ocICU2s0uzUhp110YqFEYWxzzo8BktSem8KsrMp6OMmMzrt8ciy_=s96-c	2025-05-20 08:30:16.370983+08	2025-05-22 16:44:04.342+08
\.


--
-- Name: collectionItems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: codepatchwork_user
--

SELECT pg_catalog.setval('public."collectionItems_id_seq"', 1, false);


--
-- Name: collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: codepatchwork_user
--

SELECT pg_catalog.setval('public.collections_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: codepatchwork_user
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: snippets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: codepatchwork_user
--

SELECT pg_catalog.setval('public.snippets_id_seq', 1087, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: codepatchwork_user
--

SELECT pg_catalog.setval('public.tags_id_seq', 9, true);


--
-- Name: collectionItems collectionItems_collectionid_snippetid_key; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public."collectionItems"
    ADD CONSTRAINT "collectionItems_collectionid_snippetid_key" UNIQUE (collectionid, snippetid);


--
-- Name: collectionItems collectionItems_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public."collectionItems"
    ADD CONSTRAINT "collectionItems_pkey" PRIMARY KEY (id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: snippets snippets_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.snippets
    ADD CONSTRAINT snippets_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: codepatchwork_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_collectionitems_collectionid; Type: INDEX; Schema: public; Owner: codepatchwork_user
--

CREATE INDEX idx_collectionitems_collectionid ON public."collectionItems" USING btree (collectionid);


--
-- Name: idx_collectionitems_snippetid; Type: INDEX; Schema: public; Owner: codepatchwork_user
--

CREATE INDEX idx_collectionitems_snippetid ON public."collectionItems" USING btree (snippetid);


--
-- Name: idx_comments_snippetid; Type: INDEX; Schema: public; Owner: codepatchwork_user
--

CREATE INDEX idx_comments_snippetid ON public.comments USING btree (snippetid);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: codepatchwork_user
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO codepatchwork_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: codepatchwork_user
--

ALTER DEFAULT PRIVILEGES FOR ROLE codepatchwork_user IN SCHEMA public GRANT ALL ON SEQUENCES TO codepatchwork_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: codepatchwork_user
--

ALTER DEFAULT PRIVILEGES FOR ROLE codepatchwork_user IN SCHEMA public GRANT ALL ON TABLES TO codepatchwork_user;


--
-- PostgreSQL database dump complete
--

